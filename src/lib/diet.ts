import type { Venue } from "./types";

export type DietFields = Pick<Venue, "isHalal" | "vegetarian" | "vegan" | "noSeafoodOption" | "nonHalal" | "noBeefOption">;

// A venue only passes a diet filter when it is explicitly marked as meeting it. A blank (unknown) value
// does not pass, so nobody is shown a place nobody has checked. Fill the values in with the venues sheet.
// Halal is the one exception: an unchecked venue still passes, so the default search is not empty while the
// sheet is being filled in. Only an explicit N removes a venue, and only a Y earns the HALAL badge.
const DIET_RULES: Record<string, (venue: DietFields) => boolean> = {
  Halal: (v) => v.isHalal !== false,
  Vegetarian: (v) => v.vegetarian === true || v.vegan === true,
  Vegan: (v) => v.vegan === true,
  "No Seafood": (v) => v.noSeafoodOption === true,
  "Non-Halal": (v) => v.nonHalal === true,
  "No Beef": (v) => v.noBeefOption === true,
};

export function meetsDiet(venue: DietFields, restrictions: string[]): boolean {
  return restrictions.every((restriction) => DIET_RULES[restriction]?.(venue) ?? true);
}
