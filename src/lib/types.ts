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
}

