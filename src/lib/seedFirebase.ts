import { collection, writeBatch, doc, getDocs, DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import { Venue } from "./types";

export const SAMPLE_CAMPUS_VENUES: Omit<Venue, "id">[] = [
  {
    name: "KK12 Dining Hall (Raja Dr. Nazrin Shah)",
    location: "12th Residential College, Universiti Malaya",
    avgPriceMYR: 8.5,
    avgPrepTimeMins: 5,
    isHalal: true,
    dietaryTags: ["Halal", "Budget-Friendly", "Nasi Campur", "Malay Cuisine"],
    menuItems: [
      { itemName: "Nasi Campur (Ayam Goreng + 2 Sayur)", priceMYR: 7.5 },
      { itemName: "Nasi Lemak Ayam Berempah", priceMYR: 8.0 },
      { itemName: "Teh O Ais", priceMYR: 2.0 },
      { itemName: "Roti Canai Telur", priceMYR: 3.0 },
    ],
  },
  {
    name: "Faculty of Science Food Court (FOS Bistro)",
    location: "Faculty of Science, near Department of Chemistry",
    avgPriceMYR: 11.0,
    avgPrepTimeMins: 12,
    isHalal: true,
    dietaryTags: ["Halal", "Western", "Noodles", "Fast-Casual"],
    menuItems: [
      { itemName: "Chicken Chop with Black Pepper Sauce", priceMYR: 13.5 },
      { itemName: "Mee Goreng Mamak", priceMYR: 6.5 },
      { itemName: "Claypot Yee Mee", priceMYR: 8.5 },
      { itemName: "Iced Lemon Tea", priceMYR: 3.0 },
    ],
  },
  {
    name: "KK8 Cafe (Kinabalu Residential College)",
    location: "8th Residential College, Universiti Malaya",
    avgPriceMYR: 7.0,
    avgPrepTimeMins: 8,
    isHalal: true,
    dietaryTags: ["Halal", "Budget-Friendly", "Supper Spot", "Student Favorite"],
    menuItems: [
      { itemName: "Maggi Goreng Double + Telur Mata", priceMYR: 6.5 },
      { itemName: "Nasi Goreng Kampung", priceMYR: 7.0 },
      { itemName: "Milo Ais Kaw", priceMYR: 3.2 },
      { itemName: "Keropok Lekor (5 pcs)", priceMYR: 3.5 },
    ],
  },
  {
    name: "FCSIT Corner (Faculty of Computer Science & IT)",
    location: "Block A Ground Floor, FCSIT, UM",
    avgPriceMYR: 12.5,
    avgPrepTimeMins: 10,
    isHalal: true,
    dietaryTags: ["Halal", "Coffee", "Pastries", "Grab & Go", "Vegetarian-Friendly"],
    menuItems: [
      { itemName: "Spanish Latte (Iced)", priceMYR: 9.0 },
      { itemName: "Smoked Chicken Ciabatta Sandwich", priceMYR: 12.0 },
      { itemName: "Mushroom & Cheese Quiche", priceMYR: 8.5 },
      { itemName: "Matcha Espresso Fusion", priceMYR: 11.0 },
    ],
  },
  {
    name: "Perdanasiswa Complex (KPS) Central Canteen",
    location: "Kompleks Perdanasiswa (Student Union Building), UM",
    avgPriceMYR: 9.0,
    avgPrepTimeMins: 7,
    isHalal: true,
    dietaryTags: ["Halal", "Wide Variety", "Economy Rice", "Drinks & Snacks"],
    menuItems: [
      { itemName: "Nasi Kandar Ayam Bawang + Bendi", priceMYR: 9.5 },
      { itemName: "Soto Ayam Begedil", priceMYR: 7.0 },
      { itemName: "Curry Laksa Mee", priceMYR: 8.0 },
      { itemName: "Sirap Bandung Ais", priceMYR: 2.5 },
    ],
  },
  {
    name: "Faculty of Arts & Social Sciences (FASS) Canteen",
    location: "Near FASS Main Auditorium, UM",
    avgPriceMYR: 8.0,
    avgPrepTimeMins: 6,
    isHalal: true,
    dietaryTags: ["Halal", "Authentic Malay", "Budget-Friendly", "Breakfast & Lunch"],
    menuItems: [
      { itemName: "Nasi Dagang Terengganu Gulai Ikan Tongkol", priceMYR: 8.5 },
      { itemName: "Laksam Pantai Timur", priceMYR: 7.0 },
      { itemName: "Kuih Muih Tradisional (3 pcs)", priceMYR: 2.5 },
      { itemName: "Kopi O Panas", priceMYR: 1.8 },
    ],
  },
  {
    name: "API Food Oasis (Academy of Islamic Studies)",
    location: "Academy of Islamic Studies, Universiti Malaya",
    avgPriceMYR: 9.5,
    avgPrepTimeMins: 10,
    isHalal: true,
    dietaryTags: ["Halal", "Middle Eastern", "Rice Dishes", "Quiet Ambience"],
    menuItems: [
      { itemName: "Nasi Arab Mandi Chicken", priceMYR: 14.0 },
      { itemName: "Chicken Shawarma Wrap", priceMYR: 9.5 },
      { itemName: "Fresh Barbican Apple Mocktail", priceMYR: 5.0 },
    ],
  },
];

/**
 * Seeds the Cloud Firestore database with campus food spots around Universiti Malaya.
 * Uses atomic batch write. Does not require user authentication.
 */
export async function seedFirestoreDatabase(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    // Check which specific variables are missing or uninitialized
    const diagnostics: string[] = [];
    if (!apiKey) diagnostics.push("NEXT_PUBLIC_FIREBASE_API_KEY is undefined");
    if (!projectId) diagnostics.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID is undefined");
    if (!authDomain) diagnostics.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is undefined");
    if (!appId) diagnostics.push("NEXT_PUBLIC_FIREBASE_APP_ID is undefined");

    if (diagnostics.length > 0 || !db) {
      return {
        success: false,
        count: 0,
        error: `Browser cannot read your environment variables:\n- ${diagnostics.join("\n- ")}\n\nPlease ensure your terminal running 'npm run dev' has been restarted (Ctrl+C, then npm run dev) so Next.js can reload .env.local into memory.`,
      };
    }

    console.log("Seeding venues to project:", projectId);

    const venuesCollection = collection(db, "venues");
    const existingSnapshot = await getDocs(venuesCollection);
    const existingNames = new Set<string>();
    existingSnapshot.forEach((d: QueryDocumentSnapshot<DocumentData>) => {
      const n = d.data().name;
      if (n) existingNames.add(n.trim().toLowerCase());
    });

    const venuesToInsert = SAMPLE_CAMPUS_VENUES.filter(
      (v) => !existingNames.has(v.name.trim().toLowerCase())
    );

    if (venuesToInsert.length === 0) {
      return {
        success: true,
        count: 0,
        error: "All campus venues are already seeded! No duplicates added.",
      };
    }

    const batch = writeBatch(db);
    venuesToInsert.forEach((venueData) => {
      const docRef = doc(venuesCollection);
      batch.set(docRef, {
        ...venueData,
        createdAt: new Date().toISOString(),
      });
    });

    // Add a timeout promise to prevent indefinite hanging if offline or blocked by Firestore rules
    const timeoutPromise = new Promise<{ success: boolean; count: number; error: string }>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              "Firestore request timed out after 10s. Common causes: 1) Firestore database has not been created yet in Firebase Console, 2) Firestore security rules are set to `allow read, write: if false;`, or 3) Incorrect Project ID."
            )
          ),
        10000
      )
    );

    await Promise.race([batch.commit(), timeoutPromise]);

    return { success: true, count: SAMPLE_CAMPUS_VENUES.length };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Firestore seeding failed:", error);
    return { success: false, count: 0, error: message };
  }
}

