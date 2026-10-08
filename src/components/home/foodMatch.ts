import type { RecommendationItem, VenueMatch } from "@/app/api/decide/route";
import { formatDistance } from "@/lib/geo";

export type FoodMatch = {
  id: string;
  rank: number;
  title: string;
  price: string;
  priceNote: string;
  isHalal: boolean;
  // e.g. "650 m from campus centre"; absent when the venue has no coordinates
  distanceLabel?: string;
  travelIcon: string;
  travelLabel: string;
  duration: string;
  serves: string;
  insight: string;
  mapsUrl: string;
};

export function distanceLabel(match: VenueMatch) {
  return match.distanceMeters === undefined
    ? undefined
    : `${formatDistance(match.distanceMeters)} from campus centre`;
}

export function fromRecommendation(rec: RecommendationItem, index: number, budget: number): FoodMatch {
  return {
    id: `${index}-${rec.venueName}`,
    rank: index + 1,
    title: rec.venueName,
    price: `RM ${rec.estimatedCostMYR.toFixed(2)}`,
    priceNote: `Under RM${budget}`,
    isHalal: rec.isHalal,
    distanceLabel: distanceLabel(rec),
    travelIcon: rec.travelMethod.endsWith("drive") ? "directions_car" : "directions_walk",
    travelLabel: rec.travelMethod,
    duration: `${rec.estimatedTimeMins} min total`,
    serves: rec.serves.join(", "),
    insight: rec.reasoning,
    mapsUrl: rec.mapsUrl,
  };
}
