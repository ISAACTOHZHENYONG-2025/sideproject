import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleGenAI, Type } from "@google/genai";
import type { Venue } from "@/lib/types";
import { googleMapsUrl } from "@/lib/maps";
import { UM_CAMPUS_CENTER, distanceMeters, driveMinutes, walkMinutes } from "@/lib/geo";

export interface DecideRequestPayload {
  // Free text such as "noodles" or "mcd"; empty means anything.
  craving?: string;
  maxBudget: number;
  availableTimeMins: number;
  dietaryRestrictions: string[];
  transportMode: "walk_or_public" | "private_vehicle";
}

// A venue that fits the student's budget, diet and time.
export interface VenueMatch {
  venueName: string;
  estimatedCostMYR: number;
  isHalal: boolean;
  serves: string[];
  rating?: number;
  // Straight-line distance from the UM campus centre; absent when the venue has no coordinates.
  distanceMeters?: number;
  travelMins: number;
  travelMethod: string;
  // Travel + prep time
  estimatedTimeMins: number;
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

// Off-campus spots only offered when the student can drive. Coordinates are from Google Places.
const OFF_CAMPUS_DRIVING_HOTSPOTS: Venue[] = [
  {
    name: "Village Park Restaurant",
    location: "Damansara Utama (Uptown), PJ",
    placeId: "ChIJIfYLMzFJzDERPG9vHZ7DqiE",
    latitude: 3.13769,
    longitude: 101.62333,
    avgPriceMYR: 15.0,
    avgPrepTimeMins: 10,
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
    avgPrepTimeMins: 8,
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
    location: "Lorong Kurau, Bangsar",
    placeId: "ChIJ-0H2IZtJzDEROu7FdjD33FY",
    latitude: 3.12264,
    longitude: 101.67102,
    avgPriceMYR: 18.0,
    avgPrepTimeMins: 15,
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
    avgPrepTimeMins: 6,
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
    avgPrepTimeMins: 5,
    isHalal: true,
    serves: ["rice", "nasi campur"],
    dietaryTags: ["Halal", "Budget-Friendly", "Nasi Campur"],
    menuItems: [{ itemName: "Nasi Campur (Ayam Goreng + 2 Sayur)", priceMYR: 7.5 }],
  },
  {
    name: "Perdanasiswa Complex (KPS) Central Canteen",
    location: "Kompleks Perdanasiswa, Universiti Malaya",
    avgPriceMYR: 9.0,
    avgPrepTimeMins: 7,
    isHalal: true,
    serves: ["rice", "noodles"],
    dietaryTags: ["Halal", "Economy Rice", "Student Union"],
    menuItems: [{ itemName: "Nasi Kandar Ayam Bawang + Bendi", priceMYR: 9.5 }],
  },
];

// Travel time assumed for hand-seeded venues that have no coordinates yet.
const UNKNOWN_TRAVEL_MINS = 10;
const DEFAULT_PREP_MINS = 10;
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

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function cravingPatterns(craving: string): RegExp[] {
  const key = craving.trim().toLowerCase().replace(/[^a-z0-9 ]+/g, "").replace(/s$/, "");
  if (!key) return [];
  const terms = [key, ...(CRAVING_ALIASES[key] ?? [])];
  return terms.map((term) => new RegExp(`\\b${escapeRegExp(term)}s?\\b`, "i"));
}

function venueSearchText(venue: Venue) {
  return [
    venue.name,
    venue.cuisine ?? "",
    venue.description ?? "",
    ...(venue.serves ?? []),
    ...(venue.dietaryTags ?? []),
    ...(venue.menuItems ?? []).map((m) => m.itemName).filter((name) => name !== PLACEHOLDER_MENU_ITEM),
  ].join(" | ");
}

function toVenueMatch(venue: Venue, drive: boolean): VenueMatch {
  const hasCoords = typeof venue.latitude === "number" && typeof venue.longitude === "number";
  const meters = hasCoords
    ? Math.round(distanceMeters(UM_CAMPUS_CENTER, { latitude: venue.latitude!, longitude: venue.longitude! }))
    : undefined;
  const travelMins =
    meters === undefined ? UNKNOWN_TRAVEL_MINS : drive ? driveMinutes(meters) : walkMinutes(meters);

  return {
    venueName: venue.name,
    estimatedCostMYR: venue.avgPriceMYR,
    isHalal: Boolean(venue.isHalal),
    serves: venue.serves ?? [],
    rating: venue.rating,
    distanceMeters: meters,
    travelMins,
    travelMethod: `${travelMins}-min ${drive ? "drive" : "walk"}`,
    estimatedTimeMins: travelMins + (venue.avgPrepTimeMins || DEFAULT_PREP_MINS),
    mapsUrl: googleMapsUrl(venue),
  };
}

// Code-only ranking: nearest first (in 5-minute bands), then best rated, then cheapest.
function rankByDistanceAndRating(a: Candidate, b: Candidate) {
  const band = (c: Candidate) => Math.round(c.match.travelMins / 5);
  return (
    band(a) - band(b) ||
    (b.match.rating ?? 0) - (a.match.rating ?? 0) ||
    a.match.estimatedCostMYR - b.match.estimatedCostMYR
  );
}

function fallbackReason(c: Candidate, craving: string) {
  const parts = [`${c.match.travelMethod} from campus centre`, `about RM${c.match.estimatedCostMYR.toFixed(2)}`];
  if (c.match.isHalal) parts.push("halal");
  if (c.match.rating) parts.push(`rated ${c.match.rating.toFixed(1)}`);
  const lead = craving ? `Matches "${craving}": ` : "";
  return `${lead}${parts.join(", ")}.`;
}

async function rankWithGemini(
  apiKey: string,
  candidates: Candidate[],
  craving: string,
  dietaryRestrictions: string[],
): Promise<{ recommendations: RecommendationItem[]; moreMatches: VenueMatch[] }> {
  const venues = candidates.map(({ venue, match }) => ({
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
    travel: match.travelMethod,
    totalMins: match.estimatedTimeMins,
  }));

  const prompt = `
You pick where a Universiti Malaya student should eat. Every venue below already fits their budget,
time and halal requirement, so judge them only on the craving, distance, rating and price.

Student:
- Location: somewhere on the Universiti Malaya campus; distances and travel times are from the campus centre
- Craving: ${craving || "anything (no preference)"}
- Other dietary preferences: ${dietaryRestrictions.filter((d) => d !== "Halal").join(", ") || "none"}

Rules:
- If there is a craving, only include venues that plausibly serve it (use "serves", "cuisine", "description", "menuHints", "tags" and the name;
  Malaysian terms count, e.g. mee/kuey teow/laksa are noodles, nasi is rice, "mcd" means McDonald's).
- "recommendations": the best 3 (fewer if fewer fit), best first. "reasoning" is one short sentence (under 25 words)
  and mentions the craving when there is one.
- "moreMatches": the names of every other venue that also fits, best first. Do not repeat the recommendations.
- Use venue names exactly as given.

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
                venueName: { type: Type.STRING },
                reasoning: { type: Type.STRING },
              },
              required: ["venueName", "reasoning"],
            },
          },
          moreMatches: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ["recommendations", "moreMatches"],
      },
    },
  });

  const parsed = JSON.parse(response.text ?? "{}") as {
    recommendations?: { venueName: string; reasoning: string }[];
    moreMatches?: string[];
  };

  // Map Gemini's names back to our own data so price, distance and links can't be invented.
  const byName = new Map<string, Candidate>();
  for (const c of candidates) {
    const key = c.venue.name.trim().toLowerCase();
    if (!byName.has(key)) byName.set(key, c);
  }
  const used = new Set<string>();
  const take = (name: string) => {
    const key = name.trim().toLowerCase();
    const c = byName.get(key);
    if (!c || used.has(key)) return undefined;
    used.add(key);
    return c;
  };

  const recommendations: RecommendationItem[] = [];
  for (const rec of parsed.recommendations ?? []) {
    if (recommendations.length >= 3) break;
    const c = take(rec.venueName);
    if (c) recommendations.push({ ...c.match, reasoning: rec.reasoning });
  }
  const moreMatches = (parsed.moreMatches ?? []).flatMap((name) => {
    const c = take(name);
    return c ? [c.match] : [];
  });
  return { recommendations, moreMatches };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DecideRequestPayload>;

    const craving = String(body.craving ?? "").trim().slice(0, 60);
    const maxBudget = Number(body.maxBudget ?? 15);
    const availableTimeMins = Number(body.availableTimeMins ?? 30);
    const dietaryRestrictions = Array.isArray(body.dietaryRestrictions) ? body.dietaryRestrictions : [];
    const drive = body.transportMode === "private_vehicle";
    const halalOnly = dietaryRestrictions.includes("Halal");

    // 1. Load venues from Firestore
    let venues: Venue[] = [];
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, "venues"));
        snapshot.forEach((docSnap) => {
          venues.push({ id: docSnap.id, ...(docSnap.data() as Omit<Venue, "id">) });
        });
      } catch (err) {
        console.warn("Could not fetch venues from Firestore, proceeding with fallback:", err);
      }
    }
    if (venues.length === 0) venues = FALLBACK_CAMPUS_VENUES;
    if (drive) venues = [...venues, ...OFF_CAMPUS_DRIVING_HOTSPOTS];

    // 2. Drop venues that can't work: over budget, not halal when required, or not enough time
    const candidates: Candidate[] = venues
      .map((venue) => ({ venue, match: toVenueMatch(venue, drive) }))
      .filter(({ venue, match }) => {
        if (!(venue.avgPriceMYR <= maxBudget)) return false;
        if (halalOnly && !venue.isHalal) return false;
        return match.estimatedTimeMins <= availableTimeMins;
      });

    const respond = (
      engine: DecideResponseData["engine"],
      result: Pick<DecideResponseData, "recommendations" | "moreMatches">,
    ) =>
      NextResponse.json<DecideResponseData>(
        { ...result, engine },
        { status: 200 },
      );

    if (candidates.length === 0) return respond("fallback", { recommendations: [], moreMatches: [] });

    // 3. Let Gemini pick the best 3 and order the rest by the craving
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      try {
        return respond("gemini", await rankWithGemini(apiKey, candidates, craving, dietaryRestrictions));
      } catch (err) {
        console.warn("Gemini ranking failed, using code-only fallback:", err);
      }
    }

    // 4. Code-only fallback: match the craving against serves, name, tags and menu, then rank
    const patterns = cravingPatterns(craving);
    const ranked = candidates
      .filter(({ venue }) => {
        if (patterns.length === 0) return true;
        const text = venueSearchText(venue);
        return patterns.some((p) => p.test(text));
      })
      .sort(rankByDistanceAndRating);

    return respond("fallback", {
      recommendations: ranked
        .slice(0, 3)
        .map((c) => ({ ...c.match, reasoning: fallbackReason(c, craving) })),
      moreMatches: ranked.slice(3).map((c) => c.match),
    });
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
