export interface MenuItem {
  itemName: string;
  priceMYR: number;
}

export interface Venue {
  id?: string;
  name: string;
  location: string;
  avgPriceMYR: number;
  // true: checked and halal (shows the HALAL badge). false: checked and not halal. Unset: not checked yet.
  isHalal?: boolean;
  // Diet and allergy info, filled in from the venues sheet. Unset means nobody has checked yet.
  // vegetarian: checked by hand that the venue is vegetarian, not just that it has a veg dish.
  vegetarian?: boolean;
  vegan?: boolean;
  // True when there is a decent dish without seafood
  noSeafoodOption?: boolean;
  // Free-text warning shown on the venue card, e.g. "peanut sauce in most dishes"
  allergyNotes?: string;
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

