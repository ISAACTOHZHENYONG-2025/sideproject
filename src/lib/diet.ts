import type { Venue } from "./types";

type DietFields = Pick<Venue, "isHalal" | "vegetarian" | "vegan" | "noSeafoodOption">;

// A venue only passes a diet filter when it is explicitly marked as meeting it. A blank (unknown) value
// does not pass, so nobody is shown a place nobody has checked. Fill the values in with the venues sheet.
const DIET_RULES: Record<string, (venue: DietFields) => boolean> = {
  Halal: (v) => Boolean(v.isHalal),
  Vegetarian: (v) => v.vegetarian === true || v.vegan === true,
  Vegan: (v) => v.vegan === true,
  "No Seafood": (v) => v.noSeafoodOption === true,
};

export function meetsDiet(venue: DietFields, restrictions: string[]): boolean {
  return restrictions.every((restriction) => DIET_RULES[restriction]?.(venue) ?? true);
}
