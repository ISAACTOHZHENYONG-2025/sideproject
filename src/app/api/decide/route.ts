import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { GoogleGenAI, Type } from "@google/genai";
import type { Venue } from "@/lib/types";
import { googleMapsUrl, mapsUrlForVenueName } from "@/lib/maps";

export interface DecideRequestPayload {
  maxBudget: number;
  availableTimeMins: number;
  location: string;
  dietaryRestrictions: string[];
  transportMode: "walk_or_public" | "private_vehicle";
}

export interface RecommendationItem {
  venueName: string;
  recommendedItem: string;
  estimatedCostMYR: number;
  estimatedTimeMins: number;
  travelMethod: string;
  reasoning: string;
  // Google Maps directions link; Maps works out the route from the user's location.
  mapsUrl?: string;
}

export interface DecideResponseData {
  recommendations: RecommendationItem[];
}

// Additional off-campus food hotspots within driving distance of Universiti Malaya
const OFF_CAMPUS_DRIVING_HOTSPOTS = [
  {
    name: "Village Park Restaurant",
    location: "Damansara Utama (Uptown), PJ (approx. 10-15 min drive from UM)",
    avgPriceMYR: 15.0,
    avgPrepTimeMins: 10,
    isHalal: true,
    dietaryTags: ["Halal", "Famous Nasi Lemak", "Malay Cuisine", "Top Rated"],
    menuItems: [
      { itemName: "Nasi Lemak Ayam Goreng Berempah", priceMYR: 13.5 },
      { itemName: "Soto Ayam", priceMYR: 10.5 },
      { itemName: "Teh Tarik Kaw", priceMYR: 3.8 },
    ],
  },
  {
    name: "Restoran Mahbub",
    location: "Lorong Bangsar, Bangsar (approx. 8-12 min drive from UM)",
    avgPriceMYR: 14.0,
    avgPrepTimeMins: 8,
    isHalal: true,
    dietaryTags: ["Halal", "Mamak", "Nasi Briyani", "Indian Muslim", "Late Night"],
    menuItems: [
      { itemName: "Nasi Briyani Ayam Madu", priceMYR: 14.5 },
      { itemName: "Roti Canai Special", priceMYR: 4.5 },
      { itemName: "Mee Goreng Mamak", priceMYR: 7.5 },
    ],
  },
  {
    name: "The Ganga Cafe",
    location: "Lorong Kurau, Bangsar (approx. 7-10 min drive from UM)",
    avgPriceMYR: 18.0,
    avgPrepTimeMins: 15,
    isHalal: true,
    dietaryTags: ["Vegetarian", "Vegan-Friendly", "Indian Cuisine", "Healthy"],
    menuItems: [
      { itemName: "Pratha with Dhal & Chana Masala", priceMYR: 12.0 },
      { itemName: "Vegetarian Biryani Set", priceMYR: 18.0 },
      { itemName: "Masala Chai", priceMYR: 6.0 },
    ],
  },
  {
    name: "Nasi Lemak Bumbung",
    location: "Jalan 21/11b, Sea Park, PJ (approx. 12-15 min drive from UM)",
    avgPriceMYR: 9.0,
    avgPrepTimeMins: 6,
    isHalal: true,
    dietaryTags: ["Halal", "Supper Spot", "Budget-Friendly", "PJ Classic"],
    menuItems: [
      { itemName: "Nasi Lemak Ayam Goreng + Telur Mata", priceMYR: 8.5 },
      { itemName: "Indomie Goreng Double", priceMYR: 6.5 },
      { itemName: "Limau Ais", priceMYR: 2.5 },
    ],
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<DecideRequestPayload>;

    const maxBudget = Number(body.maxBudget ?? 15);
    const availableTimeMins = Number(body.availableTimeMins ?? 30);
    const userLocation = (body.location || "Universiti Malaya Central").trim();
    const dietaryRestrictions = Array.isArray(body.dietaryRestrictions)
      ? body.dietaryRestrictions
      : [];
    const transportMode =
      body.transportMode === "private_vehicle" ? "private_vehicle" : "walk_or_public";

    // 1. Fetch campus venues from Firestore
    let campusVenues: Venue[] = [];
    if (db) {
      try {
        const snapshot = await getDocs(collection(db, "venues"));
        snapshot.forEach((docSnap) => {
          campusVenues.push({ id: docSnap.id, ...(docSnap.data() as Omit<Venue, "id">) });
        });
      } catch (err) {
        console.warn("Could not fetch venues from Firestore, proceeding with fallback:", err);
      }
    }

    // Fallback campus venues if DB collection is temporarily empty
    if (campusVenues.length === 0) {
      campusVenues = [
        {
          name: "KK12 Dining Hall (Raja Dr. Nazrin Shah)",
          location: "12th Residential College, Universiti Malaya (Near Bus Stop)",
          avgPriceMYR: 8.5,
          avgPrepTimeMins: 5,
          isHalal: true,
          dietaryTags: ["Halal", "Budget-Friendly", "Nasi Campur"],
          menuItems: [
            { itemName: "Nasi Campur (Ayam Goreng + 2 Sayur)", priceMYR: 7.5 },
            { itemName: "Nasi Lemak Ayam Berempah", priceMYR: 8.0 },
          ],
        },
        {
          name: "Faculty of Science Food Court (FOS Bistro)",
          location: "Faculty of Science, near Department of Chemistry (Shuttle Stop)",
          avgPriceMYR: 11.0,
          avgPrepTimeMins: 12,
          isHalal: true,
          dietaryTags: ["Halal", "Western", "Noodles"],
          menuItems: [
            { itemName: "Chicken Chop with Black Pepper Sauce", priceMYR: 13.5 },
            { itemName: "Claypot Yee Mee", priceMYR: 8.5 },
          ],
        },
        {
          name: "Perdanasiswa Complex (KPS) Central Canteen",
          location: "Kompleks Perdanasiswa (UM Central Bus Terminal Hub)",
          avgPriceMYR: 9.0,
          avgPrepTimeMins: 7,
          isHalal: true,
          dietaryTags: ["Halal", "Economy Rice", "Student Union"],
          menuItems: [
            { itemName: "Nasi Kandar Ayam Bawang + Bendi", priceMYR: 9.5 },
            { itemName: "Soto Ayam Begedil", priceMYR: 7.0 },
          ],
        },
      ];
    }

    // 2. Filter / expand pool depending on transportMode
    let candidatePool = [...campusVenues];

    let transportInstructions = "";
    if (transportMode === "walk_or_public") {
      transportInstructions = `
CRITICAL TRANSPORT CONSTRAINTS (WALK / PUBLIC TRANSIT ONLY):
- The user has NO vehicle. Do NOT recommend places requiring private cars or long travel.
- Prioritize immediate proximity to the user's location (${userLocation}) and bus/LRT or UM campus shuttle accessibility.
- Filter strictly for venues reachable quickly on foot or via campus shuttle bus.
- Enforce strict Total Time calculation: Total Time = Walking/Bus Transit Time + Food Prep Time.
- The estimatedTimeMins MUST be the realistic sum of transit + meal prep, and MUST NOT exceed the user's available time of ${availableTimeMins} minutes.
- travelMethod must specify a walking or campus shuttle method (e.g., "5-min walk", "UM Shuttle Bus Route C (8 mins)", "10-min walk").
`;
    } else {
      // private_vehicle: expand candidate pool to include top-rated off-campus driving spots
      candidatePool = [...candidatePool, ...OFF_CAMPUS_DRIVING_HOTSPOTS];
      transportInstructions = `
CRITICAL TRANSPORT CONSTRAINTS (PRIVATE VEHICLE):
- The user HAS a vehicle (car / motorbike). Distance is flexible.
- Prioritize top-rated and highly recommended food options (both campus and driving hotspots around Bangsar, PJ, Damansara, etc.), factoring in a reasonable drive time (5-20 mins).
- Factor in drive time + food prep time into estimatedTimeMins.
- travelMethod must specify the drive or commute method (e.g., "7-min drive", "12-min drive via Federal Highway", "4-min motorbike ride").
`;
    }

    // 3. Check for Gemini API key
    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // If Gemini key is provided, use Gemini 3.8 Flash with structured schema
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are the AI Decision Engine for the Student Food Intelligence system at Universiti Malaya (UM).
Your task is to analyze dining options and recommend the 2 to 4 best meals for the student given their constraints.

STUDENT PROFILE & CONSTRAINTS:
- Current Location: ${userLocation}
- Maximum Budget: RM${maxBudget.toFixed(2)}
- Available Time: ${availableTimeMins} minutes
- Dietary Restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(", ") : "None specified"}
- Transport Mode: ${transportMode}

${transportInstructions}

BUDGET & DIETARY RULES:
- The item's estimatedCostMYR MUST be <= RM${maxBudget.toFixed(2)}.
- If dietary restrictions are present (e.g., "Halal", "Vegetarian"), respect them strictly.
- Choose a specific dish/item from the venue's available menu or characteristic dishes.

AVAILABLE VENUE CANDIDATES DATA:
${JSON.stringify(candidatePool, null, 2)}

Provide your response adhering strictly to the structured schema.
`;

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
                description: "Ranked list of best food recommendations matching constraints.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    venueName: {
                      type: Type.STRING,
                      description: "Name of the dining venue or restaurant.",
                    },
                    recommendedItem: {
                      type: Type.STRING,
                      description: "Specific food or drink item recommended.",
                    },
                    estimatedCostMYR: {
                      type: Type.NUMBER,
                      description: "Price of the recommended item in Malaysian Ringgit (MYR).",
                    },
                    estimatedTimeMins: {
                      type: Type.NUMBER,
                      description:
                        "Total estimated time in minutes (travel time + food preparation time).",
                    },
                    travelMethod: {
                      type: Type.STRING,
                      description:
                        "How the user reaches the venue (e.g., '5-min walk', 'Campus Shuttle Bus', '10-min drive').",
                    },
                    reasoning: {
                      type: Type.STRING,
                      description:
                        "Clear explanation why this spot matches the student's budget, location, transport mode, and time constraint.",
                    },
                  },
                  required: [
                    "venueName",
                    "recommendedItem",
                    "estimatedCostMYR",
                    "estimatedTimeMins",
                    "travelMethod",
                    "reasoning",
                  ],
                },
              },
            },
            required: ["recommendations"],
          },
        },
      });

      const parsedData = JSON.parse(
        response.text ?? '{"recommendations": []}'
      ) as DecideResponseData;

      const recommendations = (parsedData.recommendations ?? []).map((rec) => ({
        ...rec,
        mapsUrl: mapsUrlForVenueName(rec.venueName, candidatePool),
      }));
      return NextResponse.json({ recommendations }, { status: 200 });
    }

    // Heuristic Fallback Engine if GEMINI_API_KEY is not yet populated
    const filteredCandidates = candidatePool.filter((v) => {
      if (dietaryRestrictions.includes("Halal") && !v.isHalal) return false;
      return true;
    });

    const recommendations: RecommendationItem[] = [];

    for (const venue of filteredCandidates) {
      if (recommendations.length >= 3) break;

      const affordableItem =
        venue.menuItems?.find((m) => m.priceMYR <= maxBudget) ||
        venue.menuItems?.[0];

      if (!affordableItem || affordableItem.priceMYR > maxBudget) continue;

      let travelMethod = "";
      let travelMins = 5;

      if (transportMode === "walk_or_public") {
        travelMethod =
          venue.location.includes("Bus") || venue.location.includes("Hub")
            ? "Campus Shuttle Bus (6 mins)"
            : "5-min walk";
        travelMins = 6;
      } else {
        travelMethod = venue.location.includes("PJ") || venue.location.includes("Bangsar")
          ? "10-min drive"
          : "4-min motorbike / car ride";
        travelMins = 10;
      }

      const totalTime = travelMins + (venue.avgPrepTimeMins || 10);
      if (totalTime > availableTimeMins) continue;

      recommendations.push({
        venueName: venue.name,
        recommendedItem: affordableItem.itemName,
        estimatedCostMYR: affordableItem.priceMYR,
        estimatedTimeMins: totalTime,
        travelMethod,
        mapsUrl: googleMapsUrl(venue),
        reasoning:
          transportMode === "walk_or_public"
            ? `Within fast walking/shuttle distance of ${userLocation}, fits budget of RM${maxBudget}, and respects dietary preferences.`
            : `Accessible by vehicle with flexible range, top-rated option under RM${maxBudget} fitting your ${availableTimeMins}-minute window.`,
      });
    }

    return NextResponse.json({ recommendations }, { status: 200 });
  } catch (error) {
    console.error("Error in /api/decide route:", error);
    return NextResponse.json(
      {
        error: "Failed to generate food decision recommendations.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
