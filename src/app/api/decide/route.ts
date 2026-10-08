import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleGenAI, Type } from "@google/genai";
import type { Venue } from "@/lib/types";
import { googleMapsUrl } from "@/lib/maps";
import { meetsDiet } from "@/lib/diet";
import { UM_CAMPUS_CENTER, distanceMeters, formatDistance } from "@/lib/geo";

export interface DecideRequestPayload {
  // Free text such as "noodles" or "mcd"; empty means anything.
  craving?: string;
  maxBudget: number;
  // Straight-line distance from the UM campus centre; null means any distance.
  maxDistanceKm?: number | null;
  dietaryRestrictions: string[];
}

// A venue that fits the student's budget, diet and distance.
export interface VenueMatch {
  venueName: string;
  estimatedCostMYR: number;
  isHalal: boolean;
  isVegetarian: boolean;
  isVegan: boolean;
  // Shown on the card as a warning; not a filter
  allergyNotes?: string;
  serves: string[];
  rating?: number;
  // Straight-line distance from the UM campus centre; absent when the venue has no coordinates.
  distanceMeters?: number;
  // Google Maps directions link; Maps works out the route from the user's location.
  mapsUrl: string;
}

export interface RecommendationItem extends VenueMatch {
  reasoning: string;
}

export interface DecideResponseData {
  recommendations: RecommendationItem[];
  moreMatches: VenueMatch[];
  engine: "gemini" | "fallback";
}

// Off-campus spots, included whenever they are within the chosen distance. Coordinates are from Google Places.
const OFF_CAMPUS_DRIVING_HOTSPOTS: Venue[] = [
  {
    name: "Village Park Restaurant",
    location: "Damansara Utama (Uptown), PJ",
    placeId: "ChIJIfYLMzFJzDERPG9vHZ7DqiE",
    latitude: 3.13769,
    longitude: 101.62333,
    avgPriceMYR: 15.0,
    isHalal: true,
    serves: ["rice", "nasi lemak", "malay"],
    dietaryTags: ["Halal", "Famous Nasi Lemak", "Malay Cuisine", "Top Rated"],
    menuItems: [
      { itemName: "Nasi Lemak Ayam Goreng Berempah", priceMYR: 13.5 },
      { itemName: "Soto Ayam", priceMYR: 10.5 },
    ],
  },
  {
    name: "Restoran Mahbub",
    location: "Lorong Bangsar, Bangsar",
    placeId: "ChIJ99BxoplJzDERhX5gIi2_BGU",
    latitude: 3.12838,
    longitude: 101.67029,
    avgPriceMYR: 14.0,
    isHalal: true,
    serves: ["rice", "biryani", "roti", "noodles", "mamak"],
    dietaryTags: ["Halal", "Mamak", "Nasi Briyani", "Indian Muslim", "Late Night"],
    menuItems: [
      { itemName: "Nasi Briyani Ayam Madu", priceMYR: 14.5 },
      { itemName: "Mee Goreng Mamak", priceMYR: 7.5 },
    ],
  },
  {
    name: "The Ganga Cafe",
    vegetarian: true,
    location: "Lorong Kurau, Bangsar",
    placeId: "ChIJ-0H2IZtJzDEROu7FdjD33FY",
    latitude: 3.12264,
    longitude: 101.67102,
    avgPriceMYR: 18.0,
    isHalal: true,
    serves: ["indian", "vegetarian", "rice"],
    dietaryTags: ["Vegetarian", "Vegan-Friendly", "Indian Cuisine", "Healthy"],
    menuItems: [
      { itemName: "Pratha with Dhal & Chana Masala", priceMYR: 12.0 },
      { itemName: "Vegetarian Biryani Set", priceMYR: 18.0 },
    ],
  },
  {
    name: "Nasi Lemak Bumbung",
    location: "Jalan 21/11b, Sea Park, PJ",
    placeId: "ChIJD0P7YHtLzDERKU8IXyctme0",
    latitude: 3.10982,
    longitude: 101.62251,
    avgPriceMYR: 9.0,
    isHalal: true,
    serves: ["rice", "nasi lemak", "noodles"],
    dietaryTags: ["Halal", "Supper Spot", "Budget-Friendly", "PJ Classic"],
    menuItems: [
      { itemName: "Nasi Lemak Ayam Goreng + Telur Mata", priceMYR: 8.5 },
      { itemName: "Indomie Goreng Double", priceMYR: 6.5 },
    ],
  },
];

// Used only when the Firestore venues collection can't be read or is empty.
const FALLBACK_CAMPUS_VENUES: Venue[] = [
  {
    name: "KK12 Dining Hall (Raja Dr. Nazrin Shah)",
    location: "12th Residential College, Universiti Malaya",
    latitude: 3.12568,
    longitude: 101.66084,
    avgPriceMYR: 8.5,
    isHalal: true,
    serves: ["rice", "nasi campur"],
    dietaryTags: ["Halal", "Budget-Friendly", "Nasi Campur"],
    menuItems: [{ itemName: "Nasi Campur (Ayam Goreng + 2 Sayur)", priceMYR: 7.5 }],
  },
  {
    name: "Perdanasiswa Complex (KPS) Central Canteen",
    location: "Kompleks Perdanasiswa, Universiti Malaya",
    avgPriceMYR: 9.0,
    isHalal: true,
    serves: ["rice", "noodles"],
    dietaryTags: ["Halal", "Economy Rice", "Student Union"],
    menuItems: [{ itemName: "Nasi Kandar Ayam Bawang + Bendi", priceMYR: 9.5 }],
  },
];

// Distance assumed for hand-seeded venues that have no coordinates yet (they are on campus).
const UNKNOWN_DISTANCE_M = 800;
const DEFAULT_MAX_DISTANCE_KM = 3;
// Ranking treats venues within the same 300 m band as equally near.
const DISTANCE_BAND_M = 300;
// Most venues sent to Gemini in one request; keeps searches fast and cheap as the venue list grows.
const GEMINI_CANDIDATE_CAP = 40;
const VENUE_CACHE_MS = 60_000;
const PLACEHOLDER_MENU_ITEM = "Typical meal";

// What students type → words that show up in venue names, serves, tags and menus.
const CRAVING_ALIASES: Record<string, string[]> = {
  noodle: ["mee", "mi", "kuey teow", "koay teow", "laksa", "ramen", "pho", "bihun", "maggi", "indomie", "pasta", "yee mee"],
  rice: ["nasi", "biryani", "briyani", "economy rice", "chicken rice"],
  "fast food": ["burger", "fried chicken", "mcdonald", "kfc", "pizza", "fast food restaurant"],
  mcd: ["mcdonald"],
  western: ["chicken chop", "burger", "pasta", "steak", "western restaurant"],
  coffee: ["cafe", "coffee shop", "kopi"],
  bread: ["bakery", "roti", "pastry"],
  mamak: ["roti canai", "nasi kandar", "mee goreng mamak"],
};

type Candidate = { venue: Venue; match: VenueMatch };
// A ranked candidate, with the engine's reason when it gave one
type Ranked = { candidate: Candidate; reasoning?: string };

// First words that don't identify a chain, so "Kafe Sains" and "Kafe Bahasa" stay separate places.
const GENERIC_FIRST_WORDS = new Set([
  "kafe", "cafe", "restoran", "restaurant", "kedai", "warung", "the", "nasi", "gerai", "medan", "food",
]);

// Branches of one chain share a key: "KFC Jalan Universiti DT" and "KFC Gateway Mall" are both "kfc".
function chainKey(name: string) {
  const normalised = name
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const first = normalised.split(" ")[0];
  return first && !GENERIC_FIRST_WORDS.has(first) ? first : normalised;
}

const nearness = (c: Candidate) => c.match.distanceMeters ?? UNKNOWN_DISTANCE_M;

// Top 3 holds at most one branch per chain, always that chain's nearest branch in the list;
// every other candidate, other branches included, keeps its order in moreMatches.
function pickTopThree(ranked: Ranked[]): { top: Ranked[]; rest: Ranked[] } {
  const top: Ranked[] = [];
  const used = new Set<Ranked>();
  const seenChains = new Set<string>();
  for (const entry of ranked) {
    if (top.length >= 3) break;
    const key = chainKey(entry.candidate.venue.name);
    if (seenChains.has(key)) continue;
    seenChains.add(key);
    const nearest = ranked
      .filter((r) => !used.has(r) && chainKey(r.candidate.venue.name) === key)
      .reduce((a, b) => (nearness(b.candidate) < nearness(a.candidate) ? b : a));
    used.add(nearest);
    // A nearer branch swapped in keeps the reason given for the chain
    top.push({ candidate: nearest.candidate, reasoning: entry.reasoning ?? nearest.reasoning });
  }
  return { top, rest: ranked.filter((r) => !used.has(r)) };
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lowercase and drop accents from Latin letters ("Café" -> "cafe") so spellings match; other scripts are kept.
function fold(text: string) {
  return text
    .normalize("NFKD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFKC")
    .toLowerCase();
}

function cravingPatterns(craving: string): RegExp[] {
  const key = fold(craving).replace(/[^\p{L}\p{N} ]+/gu, "").replace(/\s+/g, " ").trim().replace(/s$/, "");
  if (!key) return [];
  const terms = [key, ...(CRAVING_ALIASES[key] ?? [])];
  return terms.map((term) => {
    const folded = escapeRegExp(fold(term));
    // Latin terms must match whole words ("rice" is not "price"). Other scripts (Chinese, Japanese, ...) don't
    // put spaces between words, so they match anywhere in the text.
    return /[^\p{Script=Latin}\p{N}\s]/u.test(term)
      ? new RegExp(folded, "iu")
      : new RegExp(`(?<![\\p{L}\\p{N}])${folded}s?(?![\\p{L}\\p{N}])`, "iu");
  });
}

function venueSearchText(venue: Venue) {
  return fold(
    [
      venue.name,
      venue.cuisine ?? "",
      venue.description ?? "",
      ...(venue.serves ?? []),
      ...(venue.dietaryTags ?? []),
      ...(venue.menuItems ?? []).map((m) => m.itemName).filter((name) => name !== PLACEHOLDER_MENU_ITEM),
    ].join(" | "),
  );
}

function toVenueMatch(venue: Venue): VenueMatch {
  const hasCoords = typeof venue.latitude === "number" && typeof venue.longitude === "number";
  const meters = hasCoords
    ? Math.round(distanceMeters(UM_CAMPUS_CENTER, { latitude: venue.latitude!, longitude: venue.longitude! }))
    : undefined;

  return {
    venueName: venue.name,
    estimatedCostMYR: venue.avgPriceMYR,
    isHalal: venue.isHalal === true, // true only when checked; unchecked venues carry no halal claim
    isVegetarian: venue.vegetarian === true || venue.vegan === true,
    isVegan: venue.vegan === true,
    allergyNotes: venue.allergyNotes,
    serves: venue.serves ?? [],
    rating: venue.rating,
    distanceMeters: meters,
    mapsUrl: googleMapsUrl(venue),
  };
}

// Code-only ranking: nearest first (in 300 m bands), then best rated, then cheapest.
function rankByDistanceAndRating(a: Candidate, b: Candidate) {
  const band = (c: Candidate) => Math.round(nearness(c) / DISTANCE_BAND_M);
  return (
    band(a) - band(b) ||
    (b.match.rating ?? 0) - (a.match.rating ?? 0) ||
    a.match.estimatedCostMYR - b.match.estimatedCostMYR
  );
}

function fallbackReason(c: Candidate, craving: string, hasPatterns: boolean) {
  const parts = [`about RM${c.match.estimatedCostMYR.toFixed(2)}`];
  if (c.match.distanceMeters !== undefined) parts.unshift(`${formatDistance(c.match.distanceMeters)} from campus centre`);
  if (c.match.isHalal) parts.push("halal");
  if (c.match.rating) parts.push(`rated ${c.match.rating.toFixed(1)}`);
  const lead = hasPatterns ? `Matches "${craving}": ` : "";
  return `${lead}${parts.join(", ")}.`;
}

async function rankWithGemini(
  apiKey: string,
  candidates: Candidate[],
  craving: string,
  dietaryRestrictions: string[],
): Promise<Ranked[]> {
  // Gemini answers with these ids, so branches that share a name stay separate venues
  const venues = candidates.map(({ venue, match }, index) => ({
    id: `v${index + 1}`,
    name: venue.name,
    cuisine: venue.cuisine ?? null,
    description: venue.description ?? null,
    serves: match.serves,
    menuHints: (venue.menuItems ?? []).map((m) => m.itemName).filter((n) => n !== PLACEHOLDER_MENU_ITEM),
    tags: venue.dietaryTags ?? [],
    priceMYR: match.estimatedCostMYR,
    halal: match.isHalal,
    rating: match.rating ?? null,
    distanceMeters: match.distanceMeters ?? null,
  }));

  const prompt = `
You pick where a Universiti Malaya student should eat. Every venue below already fits their budget,
diet requirements and distance, so judge them only on the craving, distance, rating and price.

Student:
- Location: somewhere on the Universiti Malaya campus; distances are from the campus centre
- Craving: ${craving || "anything (no preference)"}
- Diet filters already applied in code (every venue below meets them): ${dietaryRestrictions.join(", ") || "none"}

Rules:
- If there is a craving, only include venues that plausibly serve it (use "serves", "cuisine", "description", "menuHints", "tags" and the name;
  Malaysian terms count, e.g. mee/kuey teow/laksa are noodles, nasi is rice, "mcd" means McDonald's).
- "recommendations": the best 3 (fewer if fewer fit), best first. "reasoning" is one short sentence (under 25 words)
  and mentions the craving when there is one.
- "moreMatches": the ids of every other venue that also fits, best first. Do not repeat the recommendations.
- Refer to venues by their "id" (e.g. "v12"), never by name. Several branches of a chain can share a name.

Venues:
${JSON.stringify(venues)}
`;

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: Type.OBJECT,
        properties: {
          recommendations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                venueId: { type: Type.STRING },
                reasoning: { type: Type.STRING },
              },
              required: ["venueId", "reasoning"],
            },
          },
          moreMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["recommendations", "moreMatches"],
      },
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    recommendations?: { venueId: string; reasoning: string }[];
    moreMatches?: string[];
  };

  // Map Gemini's ids back to our own data so price, distance and links can't be invented.
  const used = new Set<number>();
  const take = (id: string) => {
    const index = Number(/^v(\d+)$/.exec(id.trim())?.[1]) - 1;
    if (!(index >= 0 && index < candidates.length) || used.has(index)) return undefined;
    used.add(index);
    return candidates[index];
  };

  const ranked: Ranked[] = [];
  for (const rec of parsed.recommendations ?? []) {
    const candidate = take(rec.venueId);
    if (candidate) ranked.push({ candidate, reasoning: rec.reasoning });
  }
  for (const id of parsed.moreMatches ?? []) {
    const candidate = take(id);
    if (candidate) ranked.push({ candidate });
  }

  // With no craving, nothing should be left out on purpose, so anything Gemini didn't mention goes to the
  // end, nearest first. With a craving, an omission is usually deliberate (e.g. a cafe for a "noodles"
  // search), so it's left out.
  if (!craving) {
    const omitted = candidates.filter((_, index) => !used.has(index)).sort(rankByDistanceAndRating);
    for (const candidate of omitted) ranked.push({ candidate });
  }

  return ranked;
}

// Venue list cached in memory for a minute, so busy periods don't re-read every venue on every tap.
let venueCache: { at: number; venues: Venue[] } | undefined;

async function loadVenues(): Promise<Venue[]> {
  if (venueCache && Date.now() - venueCache.at < VENUE_CACHE_MS) return venueCache.venues;
  const venues: Venue[] = [];
  if (db) {
    try {
      const snapshot = await getDocs(collection(db, "venues"));
      snapshot.forEach((docSnap) => {
        venues.push({ id: docSnap.id, ...(docSnap.data() as Omit<Venue, "id">) });
      });
      venueCache = { at: Date.now(), venues };
    } catch (err) {
      console.warn("Could not fetch venues from Firestore, proceeding with fallback:", err);
    }
  }
  return venues;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DecideRequestPayload>;

    const craving = String(body.craving ?? "").trim().slice(0, 60);
    const maxBudget = Number(body.maxBudget ?? 15);
    const dietaryRestrictions = Array.isArray(body.dietaryRestrictions) ? body.dietaryRestrictions : [];
    const maxDistanceKm =
      body.maxDistanceKm === null
        ? null
        : typeof body.maxDistanceKm === "number" && body.maxDistanceKm > 0
          ? body.maxDistanceKm
          : DEFAULT_MAX_DISTANCE_KM;
    const patterns = cravingPatterns(craving);

    // 1. Load venues from Firestore (cached briefly so every tap doesn't re-read the whole collection)
    let venues = await loadVenues();
    if (venues.length === 0) venues = FALLBACK_CAMPUS_VENUES;
    const knownPlaceIds = new Set(venues.map((v) => v.placeId).filter(Boolean));
    venues = [...venues, ...OFF_CAMPUS_DRIVING_HOTSPOTS.filter((v) => !knownPlaceIds.has(v.placeId))];

    // 2. Drop venues that can't work: over budget, miss a ticked diet filter, or too far.
    // Venues with no coordinates are the hand-seeded on-campus ones, so the distance filter keeps them.
    const candidates: Candidate[] = venues
      .map((venue) => ({ venue, match: toVenueMatch(venue) }))
      .filter(({ venue, match }) => {
        if (!(venue.avgPriceMYR <= maxBudget)) return false;
        if (!meetsDiet(venue, dietaryRestrictions)) return false;
        return maxDistanceKm === null || match.distanceMeters === undefined || match.distanceMeters <= maxDistanceKm * 1000;
      });

    const respond = (engine: DecideResponseData["engine"], ranked: Ranked[]) => {
      const { top, rest } = pickTopThree(ranked);
      return NextResponse.json<DecideResponseData>(
        {
          recommendations: top.map(({ candidate, reasoning }) => ({
            ...candidate.match,
            reasoning: reasoning ?? fallbackReason(candidate, craving, patterns.length > 0),
          })),
          moreMatches: rest.map(({ candidate }) => candidate.match),
          engine,
        },
        { status: 200 },
      );
    };

    if (candidates.length === 0) return respond("fallback", []);

    // 3. Let Gemini pick the best 3 and order the rest by the craving
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      try {
        // Send Gemini the 40 most promising venues (keyword matches first, then nearest); the rest follow
        // in code order. With a craving, only keyword matches are added back, as Gemini would have dropped the rest.
        const matchesCraving = (c: Candidate) => patterns.length === 0 || patterns.some((p) => p.test(venueSearchText(c.venue)));
        const ordered = [...candidates].sort(
          (a, b) => Number(matchesCraving(b)) - Number(matchesCraving(a)) || rankByDistanceAndRating(a, b),
        );
        const overflow = ordered.slice(GEMINI_CANDIDATE_CAP).filter(matchesCraving);
        const ranked = await rankWithGemini(apiKey, ordered.slice(0, GEMINI_CANDIDATE_CAP), craving, dietaryRestrictions);
        if (ranked.length > 0) return respond("gemini", [...ranked, ...overflow.map((candidate) => ({ candidate }))]);
        console.warn("Gemini returned no usable venues, using code-only fallback");
      } catch (err) {
        console.warn("Gemini ranking failed, using code-only fallback:", err);
      }
    }

    // 4. Code-only fallback: match the craving against serves, name, tags and menu, then rank
    const ranked = candidates
      .filter(({ venue }) => {
        if (patterns.length === 0) return true;
        const text = venueSearchText(venue);
        return patterns.some((p) => p.test(text));
      })
      .sort(rankByDistanceAndRating);

    return respond(
      "fallback",
      ranked.map((candidate) => ({ candidate })),
    );
  } catch (error) {
    console.error("Error in /api/decide route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate food decision recommendations.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
