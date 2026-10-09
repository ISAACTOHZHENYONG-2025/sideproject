"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DecideResponseData, RecommendationItem, VenueMatch } from "@/app/api/decide/route";
import BottomNav from "@/components/BottomNav";
import { decide, toDecidePayload } from "@/lib/api";
import { meetsDiet } from "@/lib/diet";
import type { FilterDraft } from "@/lib/filters";
import FilterBottomSheet from "./FilterBottomSheet";
import FoodMatchCard from "./FoodMatchCard";
import HomeHeader from "./HomeHeader";
import MaterialIcon from "@/components/ui/MaterialIcon";
import MoreMatchesList from "./MoreMatchesList";
import { fromRecommendation } from "./foodMatch";

type Status = "loading" | "ready" | "error";

type HomePageProps = {
  initialFilters: FilterDraft;
};

// Filter changes that need a refetch. A newly ticked diet tag doesn't: the feed hides non-matching cards itself.
function countChanges(applied: FilterDraft, fetched: FilterDraft) {
  const a = toDecidePayload(applied);
  const b = toDecidePayload(fetched);
  let changes = 0;
  if (applied.craving.trim().toLowerCase() !== fetched.craving.trim().toLowerCase()) changes++;
  if (a.maxBudget !== b.maxBudget) changes++;
  if (a.maxDistanceKm !== b.maxDistanceKm) changes++;
  // An unticked diet tag does: the server left out the venues it would bring back
  if (b.dietaryRestrictions.some((tag) => !a.dietaryRestrictions.includes(tag))) changes++;
  return changes;
}

function SkeletonCard() {
  return (
    <div className="bg-surface rounded-2xl border border-[#E9ECEF] overflow-hidden animate-pulse">
      <div className="h-36 bg-surface-container" />
      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="h-4 w-2/3 rounded bg-surface-container" />
        <div className="h-3 w-1/2 rounded bg-surface-container" />
        <div className="h-12 rounded-xl bg-surface-container-low" />
      </div>
    </div>
  );
}

export default function HomePage({ initialFilters }: HomePageProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState<FilterDraft>(initialFilters);
  const [draft, setDraft] = useState<FilterDraft>(initialFilters);
  const [fetchedFor, setFetchedFor] = useState<FilterDraft | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [fetchedMoreMatches, setFetchedMoreMatches] = useState<VenueMatch[]>([]);
  const [engine, setEngine] = useState<DecideResponseData["engine"]>("fallback");
  const [showMore, setShowMore] = useState(false);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const latestRequest = useRef(0);

  const loadMatches = useCallback(async (filters: FilterDraft) => {
    const requestId = ++latestRequest.current;
    try {
      const data = await decide(toDecidePayload(filters));
      if (requestId !== latestRequest.current) return;
      setRecommendations(data.recommendations);
      setFetchedMoreMatches(data.moreMatches);
      setEngine(data.engine);
      setShowMore(false);
      setFetchedFor(filters);
      setStatus("ready");
    } catch (err) {
      if (requestId !== latestRequest.current) return;
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    // Initial fetch on mount; state is only set after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadMatches(initialFilters);
  }, [loadMatches, initialFilters]);

  const filtersChanged = fetchedFor ? countChanges(applied, fetchedFor) : 0;
  const stale = filtersChanged > 0;

  const dietFilter = toDecidePayload(applied).dietaryRestrictions;
  // The budget the server used, which "Budget Meal" caps at RM10
  const fetchedBudget = fetchedFor ? toDecidePayload(fetchedFor).maxBudget : 0;
  const matches = recommendations
    .filter((rec) => meetsDiet(rec.diet, dietFilter))
    .map((rec, index) => fromRecommendation(rec, index, fetchedBudget));
  const moreMatches = fetchedMoreMatches.filter((match) => meetsDiet(match.diet, dietFilter));

  const applyFilters = () => {
    setApplied(draft);
    setSheetOpen(false);
  };

  const updateResults = () => {
    setStatus("loading");
    void loadMatches(applied);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const actionLabel = stale
    ? `Update Results (${filtersChanged} Filter${filtersChanged === 1 ? "" : "s"} Changed)`
    : status === "loading"
      ? "Finding Meals..."
      : "Find My Optimal Meal";
  const totalMatches = matches.length + moreMatches.length;

  return (
    <div className="bg-[#f0f3f6] text-on-surface antialiased min-h-screen flex justify-center">
      <div className="w-full max-w-[420px] bg-background min-h-screen flex flex-col relative shadow-2xl">
        <HomeHeader
          filters={applied}
          onOpenFilters={() => {
            setDraft(applied);
            setSheetOpen(true);
          }}
        />

        <main className="flex-1 px-3 pt-3 flex flex-col gap-3 pb-24">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[15px] font-extrabold text-on-surface tracking-tight">
              {engine === "gemini" ? "Gemini AI Top Matches" : "Top Matches"}
            </h2>
            {status === "ready" ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7ED] text-primary tabular-nums">
                {totalMatches} Found
              </span>
            ) : null}
          </div>

          {status === "loading" && matches.length === 0 ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : null}

          {status === "error" ? (
            <div className="rounded-2xl border border-error/30 bg-error-container p-4 text-on-error-container">
              <p className="text-sm font-bold">Couldn&apos;t load recommendations</p>
              <p className="text-xs mt-1">{error}</p>
              <button
                className="mt-3 h-9 px-4 rounded-full bg-error text-on-error text-xs font-bold active:scale-95 transition-transform"
                onClick={updateResults}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : null}

          {status === "ready" && matches.length === 0 && moreMatches.length === 0 ? (
            <div className="rounded-2xl border border-[#E9ECEF] bg-surface-container-lowest p-4 text-center">
              <p className="text-sm font-bold">No matches for these filters</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Try another craving, a higher budget, or a longer distance.
              </p>
            </div>
          ) : null}

          <div className={`flex flex-col gap-3 transition-opacity ${status === "loading" ? "opacity-50" : ""}`}>
            {matches.map((match) => (
              <FoodMatchCard
                insightLabel={engine === "gemini" ? "Gemini Insight" : "Why this pick"}
                key={match.id}
                match={match}
              />
            ))}

            {moreMatches.length > 0 ? (
              <button
                aria-expanded={showMore}
                className="h-12 rounded-full border-[1.5px] border-primary text-primary text-sm font-bold flex items-center justify-center gap-1 hover:bg-[#E6F7ED] active:scale-[0.98] transition-transform tabular-nums"
                onClick={() => setShowMore((open) => !open)}
                type="button"
              >
                <span>{showMore ? "Show less" : `See more (${moreMatches.length})`}</span>
                <MaterialIcon name={showMore ? "expand_less" : "expand_more"} className="text-[18px]" />
              </button>
            ) : null}

            {showMore ? <MoreMatchesList matches={moreMatches} /> : null}
          </div>
        </main>

        <BottomNav
          active="explore"
          actionBadge={status === "ready" ? `${totalMatches} Options` : undefined}
          actionLabel={actionLabel}
          disabled={status === "loading"}
          onAction={updateResults}
          pulse={stale}
        />

        <FilterBottomSheet
          draft={draft}
          onApply={applyFilters}
          onChange={setDraft}
          onClose={() => setSheetOpen(false)}
          open={sheetOpen}
        />
      </div>
    </div>
  );
}
