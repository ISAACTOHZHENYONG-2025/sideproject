import { matchArea } from "./area";
import type { Venue } from "./types";

// What the search box means: areas the venue must be in, and food groups it should match. One group per thing
// the student typed ("chinese", "rice"); a venue matches a group when any of its terms is in the venue's text.
export interface SearchQuery {
  areas: string[];
  groups: { label: string; terms: string[] }[];
}

export const EMPTY_QUERY: SearchQuery = { areas: [], groups: [] };

const PLACEHOLDER_MENU_ITEM = "Typical meal";

// What students type → words that show up in venue names, serves, tags and menus.
const CRAVING_ALIASES: Record<string, string[]> = {
  noodle: ["mee", "mi", "kuey teow", "koay teow", "laksa", "ramen", "pho", "bihun", "maggi", "indomie", "pasta", "yee mee"],
  rice: ["nasi", "biryani", "briyani", "economy rice", "chicken rice"],
  "fast food": ["burger", "fried chicken", "mcdonald", "kfc", "pizza", "fast food restaurant"],
  mcd: ["mcdonald"],
  western: ["chicken chop", "burger", "pasta", "steak", "western restaurant"],
  coffee: ["cafe", "coffee shop", "kopi"],
  bread: ["bakery", "roti", "pastry"],
  mamak: ["roti canai", "nasi kandar", "mee goreng mamak"],
  bakuteh: ["bak kut teh"],
  bkt: ["bak kut teh"],
};

// Terms too generic to narrow anything down; dropped wherever they come from.
const GENERIC_TERMS = new Set(["food", "restaurant", "restoran", "meal", "eat", "makan", "place", "shop", "kedai", "near", "nearby"]);

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Lowercase and drop accents from Latin letters ("Café" -> "cafe") so spellings match; other scripts are kept.
export function fold(text: string) {
  return text
    .normalize("NFKD")
    .replace(/(\p{Script=Latin})\p{M}+/gu, "$1")
    .normalize("NFKC")
    .toLowerCase();
}

const isLatin = (term: string) => !/[^\p{Script=Latin}\p{N}\s]/u.test(term);

// A search term as matched: folded, punctuation dropped. Undefined for empty, generic or (Latin) under-3-letter
// terms that would match too much.
export function normaliseTerm(term: string): string | undefined {
  const key = fold(term).replace(/[^\p{L}\p{N} ]+/gu, " ").replace(/\s+/g, " ").trim();
  if (!key || GENERIC_TERMS.has(key) || GENERIC_TERMS.has(key.replace(/s$/, ""))) return undefined;
  if (isLatin(key) && key.replace(/ /g, "").length < 3 && key !== "mi") return undefined;
  return key;
}

function termPattern(term: string): RegExp {
  // Latin terms must match whole words ("rice" is not "price"), singular or plural ("noodles" finds "noodle").
  // Other scripts (Chinese, Japanese, ...) don't put spaces between words, so they match anywhere in the text.
  if (!isLatin(term)) return new RegExp(escapeRegExp(term), "iu");
  const stem = escapeRegExp(term.length > 3 ? term.replace(/s$/, "") : term);
  return new RegExp(`(?<![\\p{L}\\p{N}])${stem}s?(?![\\p{L}\\p{N}])`, "iu");
}

// One food group from what the student typed: the term itself plus its known aliases.
function groupFor(text: string): SearchQuery["groups"][number] | undefined {
  const key = normaliseTerm(text);
  if (!key) return undefined;
  const aliases = CRAVING_ALIASES[key] ?? CRAVING_ALIASES[key.replace(/s$/, "")] ?? [];
  const terms = [key, ...aliases.map(normaliseTerm).filter((t): t is string => !!t)];
  return { label: key, terms: [...new Set(terms)] };
}

// Split on commas, "+", "/", ";" and " and " so "sec17, chinese, rice" is three things.
const SEPARATORS = /\s*(?:[,+/;]|\band\b|&)\s*/i;

// The instant reading of the search box, with no AI: each separated piece is an area or a food group. Without
// separators ("sec17 chinese rice") any area words are pulled out and the rest is one phrase.
export function parseQueryLocally(text: string, knownAreas: readonly string[]): SearchQuery {
  const areas: string[] = [];
  const groups: SearchQuery["groups"] = [];
  const pieces = text.split(SEPARATORS).map((p) => p.trim()).filter(Boolean);

  for (const piece of pieces) {
    const area = matchArea(piece, knownAreas);
    if (area) {
      areas.push(area);
      continue;
    }
    // Pull area words out of a longer piece: try 3-, 2- then 1-word spans
    const words = piece.split(/\s+/);
    const rest: string[] = [];
    for (let i = 0; i < words.length; ) {
      let found = 0;
      for (let n = Math.min(3, words.length - i); n >= 1 && !found; n--) {
        const hit = matchArea(words.slice(i, i + n).join(" "), knownAreas);
        if (hit) {
          areas.push(hit);
          found = n;
        }
      }
      if (found) i += found;
      else rest.push(words[i++]);
    }
    const group = rest.length > 0 ? groupFor(rest.join(" ")) : undefined;
    if (group) groups.push(group);
  }
  return { areas: [...new Set(areas)], groups };
}

// Code's reading keeps "chinese rice" as one phrase, which is right for "chicken rice" but finds nothing for
// "chinese rice". This splits multi-word groups into one group per word, for a retry when the phrase found nothing.
// Undefined when there is no phrase to split.
export function splitPhrases(query: SearchQuery): SearchQuery | undefined {
  if (!query.groups.some((g) => g.label.includes(" "))) return undefined;
  const groups = query.groups.flatMap((g) =>
    g.label.includes(" ") ? g.label.split(" ").flatMap((word) => groupFor(word) ?? []) : [g],
  );
  const unique = groups.filter((g, i) => groups.findIndex((other) => other.label === g.label) === i);
  return { areas: query.areas, groups: unique };
}

// Everything a venue can be found by, folded once
export function venueSearchText(venue: Venue) {
  return fold(
    [
      venue.name,
      venue.cuisine ?? "",
      venue.description ?? "",
      ...(venue.serves ?? []),
      ...(venue.dietaryTags ?? []),
      ...(venue.menuItems ?? []).map((m) => m.itemName).filter((name) => name !== PLACEHOLDER_MENU_ITEM),
    ].join(" | "),
  );
}

// Compiles a query once per request. The matcher gives the labels of the food groups a venue hits, and how many it
// hits by the group's own label (always its first term) rather than a looser one: a "nasi lemak" venue, not just
// any "rice" place.
export function compileQuery(query: SearchQuery) {
  const groups = query.groups.map((g) => ({ label: g.label, patterns: g.terms.map(termPattern) }));
  return (searchText: string) => {
    const hits: string[] = [];
    let exact = 0;
    for (const g of groups) {
      if (g.patterns[0]?.test(searchText)) {
        hits.push(g.label);
        exact++;
      } else if (g.patterns.some((p) => p.test(searchText))) {
        hits.push(g.label);
      }
    }
    return { hits, exact };
  };
}

// Cleans an AI answer into a query: areas must be known ones, terms are normalised and capped. An empty query is a
// valid answer ("cheap food near me" names no food or place, so everything is shown); undefined means the answer
// wasn't in the expected shape.
export function sanitiseQuery(raw: unknown, knownAreas: readonly string[]): SearchQuery | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const { areas, groups } = raw as { areas?: unknown; groups?: unknown };
  if (!Array.isArray(areas) || !Array.isArray(groups)) return undefined;
  const cleanAreas = areas
    .filter((a): a is string => typeof a === "string")
    .map((a) => matchArea(a, knownAreas))
    .filter((a): a is string => !!a);
  const cleanGroups = groups
    .slice(0, 6)
    .flatMap((g) => {
      if (!g || typeof g !== "object") return [];
      const { label, terms } = g as { label?: unknown; terms?: unknown };
      const words = [label, ...(Array.isArray(terms) ? terms : [])]
        .filter((t): t is string => typeof t === "string" && t.length <= 30)
        .map(normaliseTerm)
        .filter((t): t is string => !!t);
      const unique = [...new Set(words)].slice(0, 12);
      return unique.length > 0 ? [{ label: normaliseTerm(String(label ?? "")) ?? unique[0], terms: unique }] : [];
    });
  return { areas: [...new Set(cleanAreas)], groups: cleanGroups };
}
