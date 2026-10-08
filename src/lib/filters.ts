export type FilterDraft = {
  craving: string;
  budget: number;
  time: number;
  transport: "walk" | "drive";
  tags: string[];
};

export const DEFAULT_FILTERS: FilterDraft = {
  craving: "",
  budget: 15,
  time: 30,
  transport: "walk",
  tags: ["Halal"],
};

export const BUDGET_RANGE = { min: 5, max: 30 };

export const TIME_OPTIONS = [
  { minutes: 15, label: "15 mins" },
  { minutes: 30, label: "30 mins" },
  { minutes: 45, label: "45 mins" },
  { minutes: 60, label: "60+ mins" },
];

export const DIET_TAGS = [
  { id: "Halal", label: "Halal (JAKIM)" },
  { id: "Vegetarian", label: "Vegetarian" },
  { id: "Vegan", label: "Vegan" },
  { id: "No Seafood", label: "No Seafood" },
  { id: "Budget Meal", label: "Budget Meal < RM10" },
];

// Filters travel from /filter to / in the URL so the home page can fetch with them.
export function filtersToSearchParams(filters: FilterDraft): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.craving.trim()) params.set("craving", filters.craving.trim());
  params.set("budget", String(filters.budget));
  params.set("time", String(filters.time));
  params.set("transport", filters.transport);
  params.set("tags", filters.tags.join(","));
  return params;
}

type SearchParams = Record<string, string | string[] | undefined>;

export function filtersFromSearchParams(params: SearchParams): FilterDraft {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const budget = Number(get("budget"));
  const time = Number(get("time"));
  const tags = get("tags");

  return {
    craving: (get("craving") ?? "").slice(0, 60),
    budget:
      Number.isFinite(budget) && budget >= BUDGET_RANGE.min && budget <= BUDGET_RANGE.max
        ? budget
        : DEFAULT_FILTERS.budget,
    time: TIME_OPTIONS.some((o) => o.minutes === time) ? time : DEFAULT_FILTERS.time,
    transport: get("transport") === "drive" ? "drive" : DEFAULT_FILTERS.transport,
    tags:
      tags === undefined
        ? DEFAULT_FILTERS.tags
        : tags.split(",").filter((tag) => DIET_TAGS.some((t) => t.id === tag)),
  };
}
