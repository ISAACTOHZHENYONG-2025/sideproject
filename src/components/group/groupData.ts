export type GroupMatch = {
  id: string;
  rank: number;
  fit: number;
  title: string;
  stall: string;
  area: string;
  areaTone: "primary" | "muted";
  price: string;
  priceNote: string;
  priceNoteStyle: "strike" | "primary" | "muted";
  priceTone: "primary" | "default";
  pickName: string;
  tag?: { label: string; tone: "primary" | "secondary" };
  queueLabel: string;
  queueTone: "primary" | "secondary";
  duration: string;
  travelIcon: string;
  travelIconTone: "primary" | "secondary";
  travelLabel: string;
  insight: string;
  secondaryCta: string;
  secondaryIcon: string;
  primaryCta: string;
};

export const GROUP_MATCHES: GroupMatch[] = [
  {
    id: "kk11",
    rank: 1,
    fit: 98,
    title: "Canteen Kinabalu (KK11)",
    stall: "Stall 4: Makcik Kunyit",
    area: "220m from FCSIT",
    areaTone: "primary",
    price: "RM 8.50",
    priceNote: "RM 10.00",
    priceNoteStyle: "strike",
    priceTone: "primary",
    pickName: "Nasi Ayam Kunyit Panas + Sambal",
    tag: { label: "Subsidy", tone: "primary" },
    queueLabel: "🟢 Low queue: ~4 mins wait",
    queueTone: "primary",
    duration: "⏱️ 14m total door-to-door",
    travelIcon: "directions_walk",
    travelIconTone: "primary",
    travelLabel: "5-min walk (Engineering Canteen)",
    insight:
      "Zero shuttle delay needed, RM6.50 under your RM15 cap, and certified 100% Jakim Halal.",
    secondaryCta: "Directions",
    secondaryIcon: "near_me",
    primaryCta: "View Stall",
  },
  {
    id: "arts",
    rank: 2,
    fit: 92,
    title: "Faculty of Arts Arcade",
    stall: "Stall 9: Selera Warisan",
    area: "Main Quad",
    areaTone: "muted",
    price: "RM 9.00",
    priceNote: "Includes Drink",
    priceNoteStyle: "primary",
    priceTone: "primary",
    pickName: "Mee Goreng Mamak + Teh O Ais Limau",
    queueLabel: "🟡 Med queue: ~8 mins wait",
    queueTone: "secondary",
    duration: "⏱️ 22m total (Shuttle line A)",
    travelIcon: "directions_bus",
    travelIconTone: "secondary",
    travelLabel: "Shuttle Stop 3 (8 mins)",
    insight:
      "Covered sheltered pathway available if rain starts. Set includes drink well inside RM15 budget.",
    secondaryCta: "Bus Live Map",
    secondaryIcon: "commute",
    primaryCta: "View Stall",
  },
  {
    id: "nest",
    rank: 3,
    fit: 86,
    title: "The Nest Student Cafe",
    stall: "Perpustakaan Utama L1",
    area: "AC Study Zone",
    areaTone: "primary",
    price: "RM 14.20",
    priceNote: "Near Budget Cap",
    priceNoteStyle: "muted",
    priceTone: "default",
    pickName: "Smoked Chicken Rice Bowl & Fruit Tea",
    tag: { label: "Study Spot", tone: "secondary" },
    queueLabel: "🟢 Seated quickly (~5 mins)",
    queueTone: "primary",
    duration: "⏱️ 26m total window",
    travelIcon: "directions_walk",
    travelIconTone: "primary",
    travelLabel: "10-min walk (Library Central)",
    insight:
      "Full air-conditioning and plug sockets available before your next 3:00 PM lecture.",
    secondaryCta: "Directions",
    secondaryIcon: "directions",
    primaryCta: "View Cafe",
  },
];
