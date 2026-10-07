export type FoodMatch = {
  id: string;
  rank: number;
  fit: number;
  title: string;
  stall: string;
  stallTone?: "slate" | "amber";
  location: string;
  locationIcon: string;
  price: string;
  priceNote: string;
  priceNoteTone: "amber" | "emerald" | "muted";
  pickLabel: string;
  pickName: string;
  duration: string;
  travelIcon: string;
  travelLabel: string;
  travelIconTone?: "primary" | "amber";
  insight: string;
  insightHighlight?: string;
  primaryCta: string;
  secondaryCta: string;
  secondaryIcon: string;
};

export const FOOD_MATCHES: FoodMatch[] = [
  {
    id: "kk11",
    rank: 1,
    fit: 98,
    title: "Canteen Kinabalu (KK11)",
    stall: "Stall 4: Makcik Kunyit",
    location: "Engineering Quad • 220m away",
    locationIcon: "apartment",
    price: "RM 8.50",
    priceNote: "Subsidized",
    priceNoteTone: "amber",
    pickLabel: "Optimal Pick",
    pickName: "Nasi Ayam Kunyit + Sambal Gesek",
    duration: "14 min total",
    travelIcon: "directions_walk",
    travelLabel: "5m walk • Engineering Canteen",
    insight:
      "Fits well within your RM15 budget, zero shuttle wait required, and certified 100% Halal by JAKIM. Low queue (",
    insightHighlight: "3 people in line",
    primaryCta: "View Menu",
    secondaryCta: "Directions",
    secondaryIcon: "near_me",
  },
  {
    id: "arts",
    rank: 2,
    fit: 92,
    title: "Arts Food Arcade",
    stall: "Stall 9: Selera Warisan",
    location: "Main Arts Quad • 650m (Covered)",
    locationIcon: "storefront",
    price: "RM 9.00",
    priceNote: "Free Drink",
    priceNoteTone: "emerald",
    pickLabel: "Optimal Combo",
    pickName: "Mee Goreng Mamak + Teh O Ais",
    duration: "22 min total",
    travelIcon: "directions_bus",
    travelLabel: "Bus Stop 3 • 8 mins",
    travelIconTone: "amber",
    insight:
      "Optimal budget-to-portion ratio. Shaded covered walkway protects from midday sun. Route A bus arrives in 3 mins.",
    primaryCta: "View Menu",
    secondaryCta: "Bus Track",
    secondaryIcon: "commute",
  },
  {
    id: "nest",
    rank: 3,
    fit: 86,
    title: "The Nest Student Cafe",
    stall: "Study Lounge",
    stallTone: "amber",
    location: "Perpustakaan Utama L1 • AC Quiet Zone",
    locationIcon: "local_library",
    price: "RM 14.20",
    priceNote: "Near Cap",
    priceNoteTone: "muted",
    pickLabel: "Healthy Pick",
    pickName: "Smoked Chicken Bowl + Fruit Tea",
    duration: "26 min total",
    travelIcon: "directions_walk",
    travelLabel: "10m walk • Main Library",
    insight:
      "Exactly within your RM15 ceiling. Cool air-conditioned seating with ample laptop power sockets before your next 3:00 PM lecture.",
    primaryCta: "View Menu",
    secondaryCta: "Directions",
    secondaryIcon: "near_me",
  },
];

