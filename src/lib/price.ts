import type { Venue } from "./types";

// A venue's usual meal price, cheapest to dearest, in MYR. min === max for a single price.
export interface PriceRange {
  min: number;
  max: number;
}

// The venue's range, falling back to the old single avgPriceMYR on docs not yet re-imported from the sheet.
// Undefined when the venue has no price at all.
export function venuePriceRange(venue: Pick<Venue, "priceMinMYR" | "priceMaxMYR" | "avgPriceMYR">): PriceRange | undefined {
  const min = Number(venue.priceMinMYR ?? venue.avgPriceMYR);
  const max = Number(venue.priceMaxMYR ?? venue.priceMinMYR ?? venue.avgPriceMYR);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return undefined;
  return min <= max ? { min, max } : { min: max, max: min };
}

// "12-25", "RM12 - 25", "12–25" or a single "15" (min = max). Undefined for a blank cell.
export function parsePriceRange(text: string, maxAllowed: number): PriceRange | undefined | Error {
  const v = text.trim().replace(/rm\s*/gi, "");
  if (!v) return undefined;
  const parts = v.split(/\s*[-–—]\s*/);
  const numbers = parts.map(Number);
  if (parts.length > 2 || numbers.some((n) => !Number.isFinite(n) || n <= 0 || n > maxAllowed)) {
    return new Error(`priceMYR must be a price or range like "12-25", each between 0 and ${maxAllowed}, got "${text}"`);
  }
  const [a, b = a] = numbers.map((n) => Math.round(n * 100) / 100);
  return { min: Math.min(a, b), max: Math.max(a, b) };
}

const amount = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2));

// "12-25" for the sheet; "12" when min and max are the same.
export function formatPriceRange(range: PriceRange) {
  return range.min === range.max ? amount(range.min) : `${amount(range.min)}-${amount(range.max)}`;
}

// A venue fits when its range overlaps the budget, i.e. its cheapest meal is affordable.
export function fitsBudget(range: PriceRange, budget: number) {
  return range.min <= budget;
}

// 0 when the whole range is within budget, 1 when only the cheaper meals are.
export function budgetComfort(range: PriceRange, budget: number) {
  return range.max <= budget ? 0 : 1;
}

export const midpoint = (range: PriceRange) => (range.min + range.max) / 2;
