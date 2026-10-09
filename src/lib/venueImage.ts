// Venue photos are static files kept in `public/venues/`, named after the venue's slug
// (e.g. "He & She Coffee" -> `/venues/he-and-she-coffee.jpg`). Nothing in the venue data
// points at them: the name is the key, so adding a photo is just dropping in a file.
// `npm run venues:photos` prints the exact filename wanted for every venue in the sheet.

export function venueSlug(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function venuePhotoPath(name: string): string {
  return `/venues/${venueSlug(name)}.jpg`;
}

// Tailwind gradient pairs for the tile shown while a photo loads, and in place of one that
// is missing. Drawn from the brand palette so a photo-less card still looks deliberate.
const TILE_GRADIENTS = [
  "from-[#00B14F] to-[#007434]", // emerald — greens and vegetarian
  "from-[#FFB800] to-[#C98A00]", // amber — rice and Malay
  "from-[#FF5722] to-[#B93A14]", // flame — mamak, Indian, grills
  "from-[#3F8EFC] to-[#1B4FB8]", // blue — noodles and soups
  "from-[#9B5DE5] to-[#5F2CA8]", // violet — cafes and desserts
];

// Food words -> tile gradient. Only needs to be good enough that similar stalls look related.
const GRADIENT_BY_FOOD: Record<string, number> = {
  vegetarian: 0,
  vegan: 0,
  salad: 0,
  rice: 1,
  nasi: 1,
  malay: 1,
  "nasi lemak": 1,
  "nasi campur": 1,
  mamak: 2,
  indian: 2,
  roti: 2,
  biryani: 2,
  western: 2,
  grill: 2,
  noodles: 3,
  noodle: 3,
  soup: 3,
  chinese: 3,
  japanese: 3,
  korean: 3,
  cafe: 4,
  coffee: 4,
  dessert: 4,
  bakery: 4,
  drinks: 4,
};

// Stable per-venue index for venues whose food types we don't recognise, so the tile colour
// never changes between renders.
function hashIndex(name: string, buckets: number): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 100000;
  return hash % buckets;
}

// `foods` is the card's comma-joined `serves` string, or a cuisine name.
export function tileGradient(name: string, foods?: string): string {
  const words = (foods ?? "").toLowerCase().split(/[,/]/);
  for (const word of words) {
    const index = GRADIENT_BY_FOOD[word.trim()];
    if (index !== undefined) return TILE_GRADIENTS[index];
  }
  return TILE_GRADIENTS[hashIndex(name, TILE_GRADIENTS.length)];
}
