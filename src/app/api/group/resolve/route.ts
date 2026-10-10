import { NextRequest, NextResponse } from "next/server";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { requireGroupEnabled } from "@/lib/featureFlags";
import { GoogleGenAI, Type } from "@google/genai";
import type { Venue } from "@/lib/types";
import { mapsUrlForVenueName } from "@/lib/mapsLinks";
import { assessDiet, mergeGroupRestrictions, normalizeVenueDiet } from "@/lib/diet";
import { budgetComfort, fitsBudget, midpoint, venuePriceRange } from "@/lib/price";

export interface Participant {
  memberName: string;
  maxBudget: number;
  availableTimeMins: number;
  transportMode: "walk_or_public" | "private_vehicle";
  dietaryRestrictions: string[];
}

export interface WinningRecommendation {
  venueName: string;
  recommendedItems: string[];
  totalCostPerPersonMYR: number;
  consensusReasoning: string;
  // Google Maps directions link; Maps works out the route from the user's location.
  mapsUrl?: string;
}

export interface BackupOption {
  venueName: string;
  recommendedItems: string[];
  totalCostPerPersonMYR: number;
  consensusReasoning: string;
  // Google Maps directions link; Maps works out the route from the user's location.
  mapsUrl?: string;
}

export interface GroupResolveResponse {
  winningRecommendation: WinningRecommendation;
  backupOptions: BackupOption[];
}

function withMapsUrls(result: GroupResolveResponse, venues: Venue[]): GroupResolveResponse {
  const addUrl = <T extends { venueName: string }>(pick: T) => ({
    ...pick,
    mapsUrl: mapsUrlForVenueName(pick.venueName, venues),
  });
  return {
    winningRecommendation: addUrl(result.winningRecommendation),
    backupOptions: (result.backupOptions ?? []).map(addUrl),
  };
}

export async function POST(req: NextRequest) {
  // Outside the try: this 404s by throwing, which the catch below would turn into a 500.
  requireGroupEnabled();
  try {
    if (!db) {
      return NextResponse.json(
        { error: "Firestore is not initialized. Check .env.local configuration." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const roomCode = body.roomCode?.trim().toUpperCase();

    if (!roomCode) {
      return NextResponse.json(
        { error: "roomCode is required to resolve group consensus." },
        { status: 400 }
      );
    }

    // 1. Fetch room doc from Firestore
    const roomsRef = collection(db, "group_rooms");
    const q = query(roomsRef, where("roomCode", "==", roomCode));
    const roomSnapshot = await getDocs(q);

    if (roomSnapshot.empty) {
      return NextResponse.json(
        { error: `Group room with code '${roomCode}' not found.` },
        { status: 404 }
      );
    }

    const roomDoc = roomSnapshot.docs[0];

    // 2. Fetch all participants from sub-collection
    const participantsRef = collection(db, "group_rooms", roomDoc.id, "participants");
    const participantsSnap = await getDocs(participantsRef);

    if (participantsSnap.empty) {
      return NextResponse.json(
        { error: "Cannot resolve consensus: No participants have joined this room yet." },
        { status: 400 }
      );
    }

    const participants: Participant[] = [];
    participantsSnap.forEach((docSnap) => {
      const data = docSnap.data();
      participants.push({
        memberName: data.memberName || "Student",
        maxBudget: Number(data.maxBudget ?? 15),
        availableTimeMins: Number(data.availableTimeMins ?? 30),
        transportMode: data.transportMode === "private_vehicle" ? "private_vehicle" : "walk_or_public",
        dietaryRestrictions: Array.isArray(data.dietaryRestrictions) ? data.dietaryRestrictions : [],
      });
    });

    // 3. Aggregate group constraints
    const strictBudgetCap = Math.min(...participants.map((p) => p.maxBudget));
    const strictTimeLimit = Math.min(...participants.map((p) => p.availableTimeMins));
    const hasWalkOnly = participants.some((p) => p.transportMode === "walk_or_public");
    const transportBottleneck: "walk_or_public" | "private_vehicle" = hasWalkOnly
      ? "walk_or_public"
      : "private_vehicle";

    // If any member picked Halal only, the whole group is halal-first. Otherwise the members' other filters add up.
    const mergedDietaryRestrictions = mergeGroupRestrictions(participants.map((p) => p.dietaryRestrictions));

    // 4. Query Firestore venues
    let candidateVenues: Venue[] = [];
    try {
      const venuesSnap = await getDocs(collection(db, "venues"));
      venuesSnap.forEach((vDoc) => {
        candidateVenues.push(normalizeVenueDiet({ id: vDoc.id, ...(vDoc.data() as Omit<Venue, "id">) }));
      });
    } catch (dbErr) {
      console.warn("Could not fetch venues from Firestore, falling back:", dbErr);
    }

    if (candidateVenues.length === 0) {
      candidateVenues = [
        {
          name: "KK12 Dining Hall (Raja Dr. Nazrin Shah)",
          location: "12th Residential College, Universiti Malaya (Shuttle Bus Stop)",
          priceMinMYR: 6,
          priceMaxMYR: 10,
          isHalal: "halal",
          dietaryTags: ["Halal", "Budget-Friendly", "Nasi Campur"],
          menuItems: [
            { itemName: "Nasi Campur (Ayam Goreng + 2 Sayur)", priceMYR: 7.5 },
            { itemName: "Nasi Lemak Ayam Berempah", priceMYR: 8.0 },
            { itemName: "Teh O Ais", priceMYR: 2.0 },
          ],
        },
        {
          name: "Perdanasiswa Complex (KPS) Central Canteen",
          location: "Kompleks Perdanasiswa (Central Hub)",
          priceMinMYR: 7,
          priceMaxMYR: 12,
          isHalal: "halal",
          dietaryTags: ["Halal", "Economy Rice", "Student Union"],
          menuItems: [
            { itemName: "Nasi Kandar Ayam Bawang + Bendi", priceMYR: 9.5 },
            { itemName: "Soto Ayam Begedil", priceMYR: 7.0 },
          ],
        },
        {
          name: "Faculty of Science Food Court (FOS Bistro)",
          location: "Faculty of Science, near Department of Chemistry",
          priceMinMYR: 8,
          priceMaxMYR: 14,
          isHalal: "halal",
          dietaryTags: ["Halal", "Western", "Noodles"],
          menuItems: [
            { itemName: "Claypot Yee Mee", priceMYR: 8.5 },
            { itemName: "Mee Goreng Mamak", priceMYR: 6.5 },
          ],
        },
      ];
    }

    // 5. Check Gemini API key
    // The same rule as /api/decide: a venue known to break the group's diet is out, and one nobody has checked
    // comes after every confirmed venue. Unchecked venues are only offered when fewer than 3 confirmed ones exist.
    const assessed = candidateVenues.map((v) => ({ v, diet: assessDiet(v, mergedDietaryRestrictions) })).filter((e) => e.diet.fits);
    const confirmedVenues = assessed.filter((e) => e.diet.unconfirmed.length === 0).map((e) => e.v);
    const unconfirmedVenues = assessed.filter((e) => e.diet.unconfirmed.length > 0).map((e) => e.v);
    const dietVenues = confirmedVenues.length >= 3 ? confirmedVenues : [...confirmedVenues, ...unconfirmedVenues];
    const confirmedSet = new Set(confirmedVenues);
    const isConfirmed = (v: Venue) => confirmedSet.has(v);
    if (dietVenues.length === 0) {
      return NextResponse.json(
        {
          error: `No venue meets everyone's diet requirements (${mergedDietaryRestrictions.join(", ")}). Ask someone to relax a filter, or mark more venues in the venues sheet.`,
        },
        { status: 404 }
      );
    }

    const apiKey =
      process.env.GEMINI_API_KEY ||
      process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are the Group Consensus Decision Engine for the Universiti Malaya (UM) Student Food Intelligence platform.
Multiple students with differing preferences and constraints have joined a group room to decide where to eat together.

PARTICIPANTS LIST:
${JSON.stringify(participants, null, 2)}

AGGREGATED GROUP BOTTLENECK CONSTRAINTS:
- Strict Budget Cap: RM${strictBudgetCap.toFixed(2)} per person (constrained by the participant with the lowest budget)
- Strict Available Time: ${strictTimeLimit} minutes (constrained by the participant with the least time)
- Transport Bottleneck: ${transportBottleneck} ${
        hasWalkOnly
          ? "(At least ONE member has NO private vehicle. The group MUST choose a place reachable via walking or campus shuttle!)"
          : "(All members have a private vehicle; driving spots can be considered.)"
      }
- Combined Dietary Restrictions: ${
        mergedDietaryRestrictions.length > 0 ? mergedDietaryRestrictions.join(", ") : "None"
      } (Must satisfy EVERY participant's requirement, e.g. Halal, Vegetarian)

CANDIDATE VENUES (none is known to break the group's diet; "dietConfirmed" false means a diet requirement was never checked for that venue):
${JSON.stringify(dietVenues.map((v) => ({ ...v, dietConfirmed: isConfirmed(v) })), null, 2)}

DECISION RULES:
1. Select 1 "winningRecommendation" that satisfies the lowest budget, strictest time, transport limitation, and all dietary restrictions.
   Prefer venues with "dietConfirmed" true; only pick one with "dietConfirmed" false when no confirmed venue fits, and say in "consensusReasoning" that its diet is unconfirmed.
   When Halal is a group requirement, never pick a venue whose "isHalal" is "unknown" while a confirmed halal venue fits.
2. Select 1 to 2 "backupOptions" as second-best alternatives, confirmed venues first.
3. "priceMinMYR"-"priceMaxMYR" is a venue's usual meal price range. A venue fits the budget when priceMinMYR is within the cap;
   prefer venues whose priceMaxMYR is within it too. "totalCostPerPersonMYR" must not exceed the cap.
4. In "consensusReasoning", write an explicit, helpful human breakdown explaining how it accommodates everyone (e.g., "Fits Student A's RM${strictBudgetCap} budget, satisfies Student B's Halal requirement, and is accessible without a car for Student C.").

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
              winningRecommendation: {
                type: Type.OBJECT,
                description: "The primary winning dining option for the entire group.",
                properties: {
                  venueName: { type: Type.STRING },
                  recommendedItems: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  totalCostPerPersonMYR: { type: Type.NUMBER },
                  consensusReasoning: { type: Type.STRING },
                },
                required: [
                  "venueName",
                  "recommendedItems",
                  "totalCostPerPersonMYR",
                  "consensusReasoning",
                ],
              },
              backupOptions: {
                type: Type.ARRAY,
                description: "Backup or alternative options that also meet constraints.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    venueName: { type: Type.STRING },
                    recommendedItems: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    totalCostPerPersonMYR: { type: Type.NUMBER },
                    consensusReasoning: { type: Type.STRING },
                  },
                  required: [
                    "venueName",
                    "recommendedItems",
                    "totalCostPerPersonMYR",
                    "consensusReasoning",
                  ],
                },
              },
            },
            required: ["winningRecommendation", "backupOptions"],
          },
        },
      });

      const parsed = JSON.parse(response.text ?? "{}") as GroupResolveResponse;
      return NextResponse.json(withMapsUrls(parsed, candidateVenues), { status: 200 });
    }

    // Heuristic Fallback Engine: venues whose price range overlaps the lowest budget, those fully within it
    // first, then the lowest typical (midpoint) price.
    const validCandidates = dietVenues
      .flatMap((v) => {
        const price = venuePriceRange(v);
        return price && fitsBudget(price, strictBudgetCap) ? [{ v, price }] : [];
      })
      .sort(
        (a, b) =>
          Number(!isConfirmed(a.v)) - Number(!isConfirmed(b.v)) ||
          budgetComfort(a.price, strictBudgetCap) - budgetComfort(b.price, strictBudgetCap) ||
          midpoint(a.price) - midpoint(b.price),
      )
      .map(({ v }) => v);
    // Typical cost per person: the venue's midpoint price, capped at the budget
    const costFor = (v: Venue) => {
      const price = venuePriceRange(v);
      return price ? Math.min(midpoint(price), strictBudgetCap) : strictBudgetCap;
    };

    const winnerVenue = validCandidates[0] || dietVenues[0];
    const suitableItems = (winnerVenue?.menuItems || [])
      .filter((m) => m.priceMYR <= strictBudgetCap)
      .map((m) => m.itemName);

    const winnerItems = suitableItems.length > 0 ? suitableItems : ["Daily Set Meal"];
    const backupVenue = validCandidates[1] || dietVenues[1] || winnerVenue;
    const backupItems = (backupVenue?.menuItems || [])
      .filter((m) => m.priceMYR <= strictBudgetCap)
      .map((m) => m.itemName);

    const participantNames = participants.map((p) => p.memberName).join(", ");

    const fallbackResponse: GroupResolveResponse = {
      winningRecommendation: {
        venueName: winnerVenue.name,
        recommendedItems: winnerItems.slice(0, 3),
        totalCostPerPersonMYR: costFor(winnerVenue),
        consensusReasoning: `Accommodates ${participants.length} students (${participantNames}) under lowest budget cap RM${strictBudgetCap.toFixed(
          2
        )}, matches ${transportBottleneck === "walk_or_public" ? "walking/campus shuttle limitation" : "vehicle access"}, and fulfills dietary preferences (${mergedDietaryRestrictions.join(", ") || "standard"}).${
          isConfirmed(winnerVenue) ? "" : " Note: this venue's diet answers are not confirmed yet."
        }`,
      },
      backupOptions: [
        {
          venueName: backupVenue.name,
          recommendedItems: backupItems.slice(0, 2),
          totalCostPerPersonMYR: costFor(backupVenue),
          consensusReasoning: `Strong alternative fitting within ${strictTimeLimit} mins and group budget.`,
        },
      ],
    };

    return NextResponse.json(withMapsUrls(fallbackResponse, candidateVenues), { status: 200 });
  } catch (error) {
    console.error("Error in /api/group/resolve:", error);
    return NextResponse.json(
      {
        error: "Failed to resolve group consensus.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
