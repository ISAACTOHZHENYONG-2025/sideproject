// Imports food places around Universiti Malaya from the Google Places API (New) into Firestore `venues`.
//   npm run db:import-nearby                    # write to Firestore
//   npm run db:import-nearby -- --dry-run       # preview only, nothing is written
//   npm run db:import-nearby -- --extent=1500   # search radius around the campus centre in metres (default 1500)
//   npm run db:import-nearby -- --max-calls=50  # cap on Places API calls this run (default 95)
//   npm run db:import-nearby -- --resume        # carry on a search that stopped at the daily quota
//   npm run db:import-nearby -- --use-cache     # reuse the saved Google results (no API calls)
// Needs GOOGLE_MAPS_API_KEY in .env.local (Places API (New) must be enabled on the key's project).
// The project allows 100 nearby searches a day, so a large area can take more than one day: run, then --resume.
//
// Google returns at most 20 places per search, so the area is covered by a grid of small searches,
// and any cell that hits the cap is split into four smaller searches.
// Re-running is safe: each place is stored under its Google place ID. A place counts as a duplicate when
// it has the same place ID, or the same name (or one name contains the other) within 60 m. Branches of
// the same chain in different places are kept. Venues already in Firestore get their description,
// hours and contact details refreshed; their name, price, halal and serves are left alone.

import * as fs from "fs";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";
import type { Venue } from "../src/lib/types";
import { UM_CAMPUS_CENTER, distanceMeters, type LatLng } from "../src/lib/geo";
import { connectFirestore, loadEnvLocal, runScript } from "./firestore";

loadEnvLocal();

// ---- Config ----------------------------------------------------------------
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY; // <- set this in .env.local
const DEFAULT_EXTENT_M = 1500;
const DEFAULT_MAX_CALLS = 95;
// Raw Google results and unsearched cells are saved here after every call, so a dry run can be followed
// by a real run without paying twice, and a search stopped by the daily quota can be resumed.
const CACHE_FILE = "places-cache.json";
const CELL_SPACING_M = 500;
const MAX_RESULTS = 20;
const FOOD_TYPES = ["restaurant", "cafe", "coffee_shop", "bakery", "fast_food_restaurant", "meal_takeaway", "food_court"];
// Places can carry a food type while mainly being something else (event venues, hotels, charities).
const FOOD_PRIMARY_TYPE =
  /restaurant|cafe|cafeteria|coffee|bakery|food_court|meal_|diner|deli|tea_house|juice|dessert|ice_cream|donut|bagel|sandwich|snack|bistro|buffet/;

// Google gives a price level, not ringgit. Rough per-person MYR for a student meal.
const PRICE_LEVEL_MYR: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 8,
  PRICE_LEVEL_MODERATE: 15,
  PRICE_LEVEL_EXPENSIVE: 30,
  PRICE_LEVEL_VERY_EXPENSIVE: 60,
};
const DEFAULT_PRICE_MYR = 12;
// Places removed from Firestore by hand, so re-runs don't add them back.
const EXCLUDED_PLACE_IDS = new Set([
  "ChIJ00x1dABJzDERF_SXoN9OfTU", // "UM": not a food place
  "ChIJpU8GKgBLzDERg9SUZYpxNSs", // As grocer: grocery shop
  "ChIJz3YLAttLzDERo6nhGrc7X10", // RC Deaf Missions Malaysia: mainly a charity
  "ChIJvYs81PBJzDERo2c1JXNRmvI", // OHMYKASEH
]);
const DEFAULT_PREP_MINS = 10;
const DUPLICATE_DISTANCE_M = 60;

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.types",
  "places.primaryType",
  "places.primaryTypeDisplayName",
  "places.editorialSummary",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.priceRange",
  "places.businessStatus",
  "places.googleMapsUri",
  "places.servesVegetarianFood",
  "places.servesBreakfast",
  "places.servesLunch",
  "places.servesDinner",
  "places.dineIn",
  "places.takeout",
  "places.delivery",
].join(",");

// ---- Types -----------------------------------------------------------------
interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: LatLng;
  types?: string[];
  primaryType?: string;
  primaryTypeDisplayName?: { text: string };
  editorialSummary?: { text: string };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  nationalPhoneNumber?: string;
  websiteUri?: string;
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
  servesBreakfast?: boolean;
  servesLunch?: boolean;
  servesDinner?: boolean;
  dineIn?: boolean;
  takeout?: boolean;
  delivery?: boolean;
}

type ImportedVenue = Venue & {
  placeId: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

// Fields refreshed on venues that are already in Firestore.
const DETAIL_FIELDS = [
  "description",
  "cuisine",
  "openingHours",
  "services",
  "phone",
  "website",
  "rating",
  "ratingCount",
  "mapsUrl",
] as const;

// ---- Helpers ---------------------------------------------------------------
function normaliseName(name: string) {
  return name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Same business: same name, or one name contains the other (e.g. "KFC" and "KFC Jalan Universiti").
function similarNames(a: string, b: string) {
  const na = normaliseName(a);
  const nb = normaliseName(b);
  return na === nb || (na.length >= 3 && nb.length >= 3 && (na.includes(nb) || nb.includes(na)));
}

function estimatePriceMYR(place: GooglePlace) {
  const start = Number(place.priceRange?.startPrice?.units);
  const end = Number(place.priceRange?.endPrice?.units ?? start);
  if (Number.isFinite(start) && start > 0) return Math.round(((start + (end || start)) / 2) * 100) / 100;
  return PRICE_LEVEL_MYR[place.priceLevel ?? ""] ?? DEFAULT_PRICE_MYR;
}

function buildTags(place: GooglePlace, name: string) {
  const tags = new Set<string>();
  if (place.types?.includes("halal_restaurant") || /\b(halal|muslim|mamak|nasi|malay|ayam)\b/i.test(name)) {
    tags.add("Halal");
  }
  if (place.servesVegetarianFood) tags.add("Vegetarian");
  if (place.primaryType) tags.add(place.primaryType.replace(/_/g, " "));
  if ((place.rating ?? 0) >= 4.5) tags.add("Top Rated");
  return [...tags];
}

function buildServices(place: GooglePlace) {
  const services: string[] = [];
  if (place.dineIn) services.push("dine-in");
  if (place.takeout) services.push("takeaway");
  if (place.delivery) services.push("delivery");
  if (place.servesBreakfast) services.push("breakfast");
  if (place.servesLunch) services.push("lunch");
  if (place.servesDinner) services.push("dinner");
  if (place.servesVegetarianFood) services.push("vegetarian options");
  return services;
}

function toVenue(place: GooglePlace): ImportedVenue | null {
  const name = place.displayName?.text?.trim();
  if (!name || !place.location || place.businessStatus === "CLOSED_PERMANENTLY") return null;
  if (EXCLUDED_PLACE_IDS.has(place.id)) return null;
  if (place.primaryType && !FOOD_PRIMARY_TYPE.test(place.primaryType)) return null;

  const avgPriceMYR = estimatePriceMYR(place);
  const dietaryTags = buildTags(place, name);
  return {
    placeId: place.id,
    name,
    location: place.formattedAddress ?? name,
    avgPriceMYR,
    avgPrepTimeMins: DEFAULT_PREP_MINS,
    isHalal: true, // halal by default for now; correct it in the venues sheet
    dietaryTags,
    menuItems: [{ itemName: "Typical meal", priceMYR: avgPriceMYR }], // /api/decide needs at least one item
    description: place.editorialSummary?.text,
    cuisine: place.primaryTypeDisplayName?.text,
    openingHours: place.regularOpeningHours?.weekdayDescriptions,
    services: buildServices(place),
    phone: place.nationalPhoneNumber,
    website: place.websiteUri,
    latitude: place.location.latitude,
    longitude: place.location.longitude,
    distanceMeters: Math.round(distanceMeters(UM_CAMPUS_CENTER, place.location)),
    rating: place.rating,
    ratingCount: place.userRatingCount,
    mapsUrl: place.googleMapsUri,
    source: "google_places",
    createdAt: new Date().toISOString(),
  };
}

function withoutUndefined<T extends object>(obj: T) {
  return Object.fromEntries(Object.entries(obj).filter(([, val]) => val !== undefined));
}

// Point offset from the campus centre by metres north/east.
function offset(northM: number, eastM: number): LatLng {
  const latitude = UM_CAMPUS_CENTER.latitude + northM / 111320;
  const longitude =
    UM_CAMPUS_CENTER.longitude + eastM / (111320 * Math.cos((UM_CAMPUS_CENTER.latitude * Math.PI) / 180));
  return { latitude, longitude };
}

async function searchNearby(center: LatLng, radius: number): Promise<GooglePlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_MAPS_API_KEY!,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: FOOD_TYPES,
      maxResultCount: MAX_RESULTS,
      rankPreference: "DISTANCE",
      locationRestriction: { circle: { center, radius } },
    }),
  });
  if (res.status === 429) throw new QuotaError();
  if (!res.ok) throw new Error(`Places API ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { places?: GooglePlace[] };
  return data.places ?? [];
}

class QuotaError extends Error {}

function numberArg(name: string, fallback: number) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`));
  return arg ? Number(arg.split("=")[1]) : fallback;
}

type Cell = { north: number; east: number; spacing: number };
type SearchCache = { extent: number; calls: number; places: GooglePlace[]; pending: Cell[] };

function readCache(): SearchCache | undefined {
  if (!fs.existsSync(CACHE_FILE)) return undefined;
  return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8")) as SearchCache;
}

// Searches a grid of cells around the campus centre, splitting any cell that hits Google's 20-result cap.
// Progress is saved after every call, so a run stopped by the daily quota can carry on with --resume.
async function searchGrid(extent: number, maxCalls: number, resume: boolean) {
  const cache = resume ? readCache() : undefined;
  let queue: Cell[];
  const found = new Map<string, GooglePlace>();
  let totalCalls = 0;

  if (cache && cache.extent === extent && cache.pending.length > 0) {
    queue = cache.pending;
    cache.places.forEach((p) => found.set(p.id, p));
    totalCalls = cache.calls;
    console.log(`Resuming: ${found.size} places from ${totalCalls} earlier call(s), ${queue.length} cell(s) left.`);
  } else {
    if (resume) console.log("Nothing to resume for this --extent; starting a fresh search.");
    const steps = Math.ceil(extent / CELL_SPACING_M);
    queue = [];
    for (let i = -steps; i <= steps; i++) {
      for (let j = -steps; j <= steps; j++) {
        // Round area: skip grid corners that lie beyond the extent
        if (Math.hypot(i, j) * CELL_SPACING_M > extent + CELL_SPACING_M / 2) continue;
        queue.push({ north: i * CELL_SPACING_M, east: j * CELL_SPACING_M, spacing: CELL_SPACING_M });
      }
    }
    console.log(`Searching ${queue.length} cells within about ${extent} m of the campus centre (max ${maxCalls} calls)...`);
  }

  const save = () =>
    fs.writeFileSync(
      CACHE_FILE,
      JSON.stringify({ extent, calls: totalCalls, places: [...found.values()], pending: queue } satisfies SearchCache),
    );

  let calls = 0;
  let stopReason = "";
  while (queue.length > 0) {
    if (calls >= maxCalls) {
      stopReason = `reached --max-calls=${maxCalls}`;
      break;
    }
    const cell = queue[0];
    // Slightly more than half the cell diagonal, so neighbouring circles leave no gaps.
    const radius = Math.ceil((cell.spacing * Math.SQRT2) / 2) + 10;
    let places: GooglePlace[];
    try {
      places = await searchNearby(offset(cell.north, cell.east), radius);
    } catch (err) {
      if (err instanceof QuotaError) {
        stopReason = "Google's daily Places quota is used up";
        break;
      }
      save();
      throw err;
    }
    queue.shift();
    calls++;
    totalCalls++;
    for (const place of places) found.set(place.id, place);
    if (places.length >= MAX_RESULTS && cell.spacing > CELL_SPACING_M / 4) {
      const half = cell.spacing / 2;
      for (const [dn, de] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
        queue.push({ north: cell.north + (dn * half) / 2, east: cell.east + (de * half) / 2, spacing: half });
      }
    }
    save();
    if (calls % 25 === 0) console.log(`  ${calls} calls, ${found.size} places so far`);
  }
  save();
  console.log(`Google: ${calls} call(s) this run, ${found.size} unique place(s) in total.`);
  if (queue.length > 0) {
    console.log(`Search stopped early (${stopReason}); ${queue.length} cell(s) left.`);
    console.log("Run again with --resume to carry on (the daily quota resets at 3 pm Malaysia time).");
  }
  return found;
}

function loadCache(): Map<string, GooglePlace> {
  const cache = readCache();
  if (!cache) {
    console.error(`${CACHE_FILE} not found. Run once without --use-cache first.`);
    process.exit(1);
  }
  console.log(`Using ${cache.places.length} cached place(s) from ${CACHE_FILE} (no Places API calls).`);
  if (cache.pending.length > 0) console.log(`  The cached search is incomplete: ${cache.pending.length} cell(s) left.`);
  return new Map(cache.places.map((p) => [p.id, p]));
}

// ---- Main ------------------------------------------------------------------
async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const extent = numberArg("extent", DEFAULT_EXTENT_M);
  const maxCalls = numberArg("max-calls", DEFAULT_MAX_CALLS);

  if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY.includes("your_google_maps_api_key_here")) {
    console.error("Missing GOOGLE_MAPS_API_KEY. Add it to .env.local (see .env.local.example).");
    process.exit(1);
  }
  if (!Number.isFinite(extent) || extent < 100 || extent > 10000) {
    console.error("--extent must be between 100 and 10000 metres.");
    process.exit(1);
  }
  if (!Number.isInteger(maxCalls) || maxCalls < 1) {
    console.error("--max-calls must be a whole number above 0.");
    process.exit(1);
  }

  const found = process.argv.includes("--use-cache")
    ? loadCache()
    : await searchGrid(extent, maxCalls, process.argv.includes("--resume"));

  const venues = [...found.values()]
    .map(toVenue)
    .filter((v): v is ImportedVenue => v !== null)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
  console.log(`${venues.length} open food place(s) after dropping closed and non-food places.`);

  // 2. Compare with what's already in Firestore
  const db = connectFirestore();
  const existing = (await getDocs(collection(db, "venues"))).docs.map((d) => ({ id: d.id, ...(d.data() as Venue) }));
  const existingByPlaceId = new Map(existing.map((v) => [v.placeId ?? v.id, v]));

  const sameAsExisting = (venue: ImportedVenue) =>
    existing.find((v) => {
      if (!v.name || !similarNames(v.name, venue.name)) return false;
      // Hand-seeded venues have no coordinates, so only an exact name match counts for them
      if (v.latitude == null || v.longitude == null) return normaliseName(v.name) === normaliseName(venue.name);
      return distanceMeters(venue, { latitude: v.latitude, longitude: v.longitude }) <= DUPLICATE_DISTANCE_M;
    });

  const toAdd: ImportedVenue[] = [];
  const toRefresh: { id: string; name: string; data: Partial<Venue> }[] = [];
  const skipped: string[] = [];
  for (const venue of venues) {
    const known = existingByPlaceId.get(venue.placeId);
    if (known) {
      const details = withoutUndefined(Object.fromEntries(DETAIL_FIELDS.map((f) => [f, venue[f]])));
      toRefresh.push({ id: known.id!, name: known.name, data: details });
      continue;
    }
    const match = sameAsExisting(venue);
    const dupeInBatch = toAdd.find(
      (v) => similarNames(v.name, venue.name) && distanceMeters(v, venue) <= DUPLICATE_DISTANCE_M,
    );
    if (match || dupeInBatch) {
      skipped.push(`${venue.name} (same as "${(match ?? dupeInBatch)!.name}")`);
    } else {
      toAdd.push(venue);
    }
  }

  console.log(`\n${toAdd.length} new, ${toRefresh.length} already in Firestore (details refreshed), ${skipped.length} duplicate(s) skipped.`);
  for (const v of toAdd) {
    console.log(`  + ${v.name} | ${v.cuisine ?? "?"} | RM${v.avgPriceMYR.toFixed(2)} | ${v.distanceMeters} m`);
  }
  for (const s of skipped) console.log(`  = ${s}`);

  if (dryRun) {
    console.log("\nDry run: nothing written.");
    return;
  }

  // 3. Write in batches (Firestore limit is 500); the place ID is the document ID, so re-runs can't duplicate
  const writes = [
    ...toAdd.map((v) => ({ id: v.placeId, data: withoutUndefined(v), merge: false })),
    ...toRefresh.map((r) => ({ id: r.id, data: r.data, merge: true })),
  ];
  for (let i = 0; i < writes.length; i += 400) {
    const batch = writeBatch(db);
    for (const w of writes.slice(i, i + 400)) {
      if (w.merge) batch.update(doc(db, "venues", w.id), w.data);
      else batch.set(doc(db, "venues", w.id), w.data);
    }
    await batch.commit();
  }
  console.log(`\nAdded ${toAdd.length} venue(s) and refreshed details on ${toRefresh.length}.`);
}

runScript(main);
