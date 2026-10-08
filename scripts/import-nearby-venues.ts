// Imports food places around Universiti Malaya from the Google Places API (New) into Firestore `venues`.
//   npm run db:import-nearby               # write to Firestore
//   npm run db:import-nearby -- --dry-run  # preview only, nothing is written
//   npm run db:import-nearby -- --radius=1000
// Needs GOOGLE_MAPS_API_KEY in .env.local (Places API (New) must be enabled on the key's project).
// Re-running is safe: each place is stored under its Google place ID and skipped if it already exists.

import * as fs from "fs";
import * as path from "path";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch } from "firebase/firestore";
import type { Venue } from "../src/lib/types";

function loadEnvLocal() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      process.env[key] = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
}

loadEnvLocal();

// ---- Config ----------------------------------------------------------------
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // <- set this in .env.local
const UM_CENTER = { latitude: 3.1209, longitude: 101.6538 }; // Universiti Malaya
const DEFAULT_RADIUS_M = 1500;
const PLACE_TYPE_GROUPS = [
  ["restaurant"],
  ["cafe", "coffee_shop"],
  ["fast_food_restaurant", "bakery", "meal_takeaway"],
];
// Google gives a price level, not ringgit. Rough per-person MYR for a student meal.
const PRICE_LEVEL_MYR: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 8,
  PRICE_LEVEL_MODERATE: 15,
  PRICE_LEVEL_EXPENSIVE: 30,
  PRICE_LEVEL_VERY_EXPENSIVE: 60,
};
const DEFAULT_PRICE_MYR = 12;
const DEFAULT_PREP_MINS = 10;
const DUPLICATE_DISTANCE_M = 60; // same normalised name within this distance = same place

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.primaryType",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.priceRange",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.servesVegetarianFood",
].join(",");

// ---- Types -----------------------------------------------------------------
interface LatLng {
  latitude: number;
  longitude: number;
}

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: LatLng;
  primaryType?: string;
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: {
    startPrice?: { units?: string };
    endPrice?: { units?: string };
  };
  businessStatus?: string;
  googleMapsUri?: string;
  servesVegetarianFood?: boolean;
}

type ImportedVenue = Venue & {
  placeId: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

// ---- Helpers ---------------------------------------------------------------
function distanceMeters(a: LatLng, b: LatLng) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function normaliseName(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function estimatePriceMYR(place: GooglePlace) {
  const start = Number(place.priceRange?.startPrice?.units);
  const end = Number(place.priceRange?.endPrice?.units ?? start);
  if (Number.isFinite(start) && start > 0) return Math.round(((start + (end || start)) / 2) * 100) / 100;
  return PRICE_LEVEL_MYR[place.priceLevel ?? ""] ?? DEFAULT_PRICE_MYR;
}

function buildTags(place: GooglePlace, name: string) {
  const tags = new Set<string>();
  if (/\b(halal|muslim|mamak|nasi|malay|ayam)\b/i.test(name)) tags.add("Halal");
  if (place.servesVegetarianFood) tags.add("Vegetarian");
  if (place.primaryType) tags.add(place.primaryType.replace(/_/g, " "));
  if ((place.rating ?? 0) >= 4.5) tags.add("Top Rated");
  return [...tags];
}

function toVenue(place: GooglePlace): ImportedVenue | null {
  const name = place.displayName?.text?.trim();
  if (!name || !place.location || place.businessStatus === "CLOSED_PERMANENTLY") return null;

  const avgPriceMYR = estimatePriceMYR(place);
  const dietaryTags = buildTags(place, name);
  return {
    placeId: place.id,
    name,
    location: place.formattedAddress ?? name,
    avgPriceMYR,
    avgPrepTimeMins: DEFAULT_PREP_MINS,
    isHalal: dietaryTags.includes("Halal"), // name-based guess; Google exposes no halal field
    dietaryTags,
    menuItems: [{ itemName: "Typical meal", priceMYR: avgPriceMYR }], // /api/decide needs at least one item
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    distanceMeters: Math.round(distanceMeters(UM_CENTER, place.location)),
    rating: place.rating,
    ratingCount: place.userRatingCount,
    mapsUrl: place.googleMapsUri,
    source: "google_places",
    createdAt: new Date().toISOString(),
  };
}

async function searchNearby(includedTypes: string[], radius: number): Promise<GooglePlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes,
      maxResultCount: 20,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center: UM_CENTER, radius } },
    }),
  });
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { places?: GooglePlace[] };
  return data.places ?? [];
}

// ---- Main ------------------------------------------------------------------
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const radiusArg = process.argv.find((a) => a.startsWith("--radius="));
  const radius = radiusArg ? Number(radiusArg.split("=")[1]) : DEFAULT_RADIUS_M;

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("your_google_maps_api_key_here")) {
    console.error("Missing GOOGLE_MAPS_API_KEY. Add it to .env.local (see .env.local.example).");
    process.exit(1);
  }
  if (!Number.isFinite(radius) || radius <= 0 || radius > 50000) {
    console.error("--radius must be between 1 and 50000 metres.");
    process.exit(1);
  }

  // 1. Fetch from Google, deduplicating by place ID across type groups
  const found = new Map<string, ImportedVenue>();
  for (const types of PLACE_TYPE_GROUPS) {
    const places = await searchNearby(types, radius);
    console.log(`Google: ${places.length} result(s) for [${types.join(", ")}]`);
    for (const place of places) {
      const venue = toVenue(place);
      if (venue && !found.has(venue.placeId)) found.set(venue.placeId, venue);
    }
  }

  // 2. Load existing venues so we never add one twice
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Missing Firebase credentials in .env.local.");
    process.exit(1);
  }
  const db = getFirestore(getApps().length > 0 ? getApp() : initializeApp(firebaseConfig));
  const existing = (await getDocs(collection(db, "venues"))).docs.map((d) => ({ id: d.id, ...(d.data() as Partial<Venue>) }));

  const existingPlaceIds = new Set(existing.map((v) => v.placeId ?? v.id));
  const sameAsExisting = (venue: ImportedVenue) => {
    if (existingPlaceIds.has(venue.placeId)) return true;
    const key = normaliseName(venue.name);
    return existing.some((v) => {
      if (!v.name || normaliseName(v.name) !== key) return false;
      // Hand-seeded venues have no coordinates, so a matching name alone counts as a duplicate
      if (v.latitude == null || v.longitude == null) return true;
      return distanceMeters(venue, { latitude: v.latitude, longitude: v.longitude }) <= DUPLICATE_DISTANCE_M;
    });
  };

  // Google can list the same business under two place IDs, so also compare against what we're about to add
  const toAdd: ImportedVenue[] = [];
  let skipped = 0;
  for (const venue of [...found.values()].sort((a, b) => a.distanceMeters - b.distanceMeters)) {
    const dupeInBatch = toAdd.some(
      (v) => normaliseName(v.name) === normaliseName(venue.name) && distanceMeters(v, venue) <= DUPLICATE_DISTANCE_M,
    );
    if (sameAsExisting(venue) || dupeInBatch) skipped++;
    else toAdd.push(venue);
  }

  console.log(`\n${found.size} unique place(s) from Google, ${skipped} duplicate(s) skipped, ${toAdd.length} new.`);
  for (const v of toAdd) {
    console.log(`  + ${v.name} | RM${v.avgPriceMYR.toFixed(2)} | ${v.distanceMeters}m | ${v.location}`);
  }

  if (dryRun) {
    console.log("\nDry run: nothing written.");
    return;
  }
  if (toAdd.length === 0) return;

  // 3. Write in batches (Firestore limit is 500); the place ID is the document ID, so re-runs can't duplicate
  for (let i = 0; i < toAdd.length; i += 400) {
    const batch = writeBatch(db);
    for (const v of toAdd.slice(i, i + 400)) {
      const data = Object.fromEntries(Object.entries(v).filter(([, val]) => val !== undefined));
      batch.set(doc(db, "venues", v.placeId), data);
    }
    await batch.commit();
  }
  console.log(`\nWrote ${toAdd.length} venue(s) to Firestore.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
