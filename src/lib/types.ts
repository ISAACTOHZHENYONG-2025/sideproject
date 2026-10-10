export interface MenuItem {
  itemName: string;
  priceMYR: number;
}

// A diet answer from the venues sheet. "unknown" (or unset) means nobody has checked yet.
export type DietAnswer = "yes" | "no" | "unknown";
export type HalalStatus = "halal" | "non-halal" | "unknown";

export interface Venue {
  id?: string;
  name: string;
  location: string;
  // Usual meal price range in MYR, from the venues sheet's priceMYR column ("12-25"). Equal for a single price.
  priceMinMYR?: number;
  priceMaxMYR?: number;
  // Old single price, still on docs not re-imported since ranges arrived; read it through venuePriceRange().
  avgPriceMYR?: number;
  // "halal" shows the HALAL badge. Unset is the same as "unknown".
  // Docs not re-imported since the three-word answers still hold true/false; read venues through normalizeVenueDiet().
  isHalal?: HalalStatus;
  // Diet and allergy info, filled in from the venues sheet. Unset is the same as "unknown".
  // vegetarian: checked by hand that the venue is vegetarian, not just that it has a veg dish.
  vegetarian?: DietAnswer;
  vegan?: DietAnswer;
  // "yes" when there is a decent dish without seafood
  noSeafoodOption?: DietAnswer;
  // True when the venue is non-halal (e.g. serves pork or alcohol); separate from isHalal so it can be answered on its own
  nonHalal?: boolean;
  // True when there is a decent dish without beef
  noBeefOption?: boolean;
  // Free-text warning shown on the venue card, e.g. "peanut sauce in most dishes"
  allergyNotes?: string;
  // Where the sheet's halal, price and diet answers came from; for whoever edits the sheet, never shown in the app.
  researchNotes?: string;
  dietaryTags: string[];
  menuItems: MenuItem[];
  // Food types the venue serves, e.g. ["rice", "noodles"]; filled in from the venues sheet.
  serves?: string[];
  createdAt?: string;
  // Google Places ID, when the venue was imported from Places; makes map links exact.
  placeId?: string;
  // Set on venues imported from Google Places
  // Google says the menu has some vegetarian dishes. NOT the same as `vegetarian`; reference only.
  hasVegetarianOptions?: boolean;
  description?: string;
  cuisine?: string;
  openingHours?: string[];
  // e.g. ["dine-in", "takeaway", "breakfast"]
  services?: string[];
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  rating?: number;
  ratingCount?: number;
  mapsUrl?: string;
  source?: string;
}

