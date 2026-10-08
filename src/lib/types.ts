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
  createdAt?: string;
  // Set on venues imported from Google Places
  placeId?: string;
  latitude?: number;
  longitude?: number;
  distanceMeters?: number;
  rating?: number;
  ratingCount?: number;
  mapsUrl?: string;
  source?: string;
}

