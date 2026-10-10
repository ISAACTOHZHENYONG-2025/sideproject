import type { DietAnswer, HalalStatus, Venue } from "./types";

export type DietFields = Pick<Venue, "isHalal" | "vegetarian" | "vegan" | "noSeafoodOption" | "nonHalal" | "noBeefOption">;

// Venue docs not re-imported since the three-word answers still hold true/false (and older sheets Y/N).
function readAnswer(raw: unknown): DietAnswer | undefined {
  if (raw === true) return "yes";
  if (raw === false) return "no";
  if (typeof raw !== "string") return undefined;
  const v = raw.trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(v)) return "yes";
  if (["no", "n", "false", "0"].includes(v)) return "no";
  return v === "unknown" ? "unknown" : undefined;
}

// A venue the sheet marks nonHalal without a halal answer is non-halal. An explicit halal answer wins.
function readHalal(raw: unknown, nonHalalFlag: unknown): HalalStatus | undefined {
  if (typeof raw === "string" && ["halal", "non-halal"].includes(raw.trim().toLowerCase())) {
    return raw.trim().toLowerCase() as HalalStatus;
  }
  const answer = readAnswer(raw);
  if (answer === "yes") return "halal";
  if (answer === "no") return "non-halal";
  if (nonHalalFlag === true) return "non-halal";
  return answer;
}

// Run every venue read from Firestore through this, so the rest of the app only sees the three-word answers.
export function normalizeVenueDiet(venue: Venue): Venue {
  return {
    ...venue,
    isHalal: readHalal(venue.isHalal, venue.nonHalal),
    vegetarian: readAnswer(venue.vegetarian),
    vegan: readAnswer(venue.vegan),
    noSeafoodOption: readAnswer(venue.noSeafoodOption),
  };
}

type Verdict = "yes" | "no" | "unknown";

// How a venue stands on one ticked filter. "no" removes the venue; "unknown" keeps it but unconfirmed.
const DIET_RULES: Record<string, { label: string; check: (venue: DietFields) => Verdict }> = {
  Halal: {
    label: "Halal",
    check: (v) => (v.isHalal === "halal" ? "yes" : v.isHalal === "non-halal" ? "no" : "unknown"),
  },
  "Non-Halal": {
    label: "Halal",
    check: (v) => (v.isHalal === "non-halal" ? "yes" : v.isHalal === "halal" ? "no" : "unknown"),
  },
  // A vegan venue is vegetarian too
  Vegetarian: {
    label: "Vegetarian",
    check: (v) => (v.vegan === "yes" || v.vegetarian === "yes" ? "yes" : v.vegetarian === "no" ? "no" : "unknown"),
  },
  "No Seafood": { label: "No seafood", check: (v) => v.noSeafoodOption ?? "unknown" },
  // Vegan and No Beef are not filters for now; vegan and noBeefOption stay in the venues sheet for when they come back.
};

// Halal and Non-Halal both ticked means "either", the same as neither.
export function effectiveRestrictions(restrictions: string[]): string[] {
  const both = restrictions.includes("Halal") && restrictions.includes("Non-Halal");
  return [...new Set(restrictions)].filter((r) => !(both && (r === "Halal" || r === "Non-Halal")));
}

export type DietFit = {
  // False when the venue is known not to meet a ticked filter
  fits: boolean;
  // Labels like "Halal unconfirmed": ticked filters nobody has checked this venue for
  unconfirmed: string[];
};

export function assessDiet(venue: DietFields, restrictions: string[]): DietFit {
  const unconfirmed: string[] = [];
  for (const restriction of effectiveRestrictions(restrictions)) {
    const rule = DIET_RULES[restriction];
    if (!rule) continue;
    const verdict = rule.check(venue);
    if (verdict === "no") return { fits: false, unconfirmed: [] };
    if (verdict === "unknown") unconfirmed.push(`${rule.label} unconfirmed`);
  }
  return { fits: true, unconfirmed };
}

// One group diet from every member's ticks. Halal-only wins over Non-halal-only, so a member who needs
// halal is never sent to a non-halal venue. Other filters apply if any member ticked them.
export function mergeGroupRestrictions(members: string[][]): string[] {
  const modes = members.map((m) => {
    const eff = effectiveRestrictions(m);
    return eff.includes("Halal") ? "Halal" : eff.includes("Non-Halal") ? "Non-Halal" : null;
  });
  const halal = modes.includes("Halal") ? "Halal" : modes.includes("Non-Halal") ? "Non-Halal" : null;
  const others = members.flat().map((r) => r.trim()).filter((r) => r && r !== "Halal" && r !== "Non-Halal");
  return [...(halal ? [halal] : []), ...new Set(others)];
}
