export interface MenuItem {
  itemName: string;
  priceMYR: number;
}

export interface Venue {
  id?: string;
  name: string;
  location: string;
  avgPriceMYR: number;
  avgPrepTimeMins: number;
  isHalal: boolean;
  dietaryTags: string[];
  menuItems: MenuItem[];
  // Food types the venue serves, e.g. ["rice", "noodles"]; filled in from the venues sheet.
  serves?: string[];
  createdAt?: string;
  // Google Places ID, when the venue was imported from Places; makes map links exact.
  placeId?: string;
  // Set on venues imported from Google Places
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  rating?: number;
  ratingCount?: number;
  mapsUrl?: string;
  source?: string;
}

