"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import BottomDock from "@/components/BottomDock";
import { decide, toDecidePayload } from "@/lib/api";
import FilterBottomSheet, { DEFAULT_FILTERS, type FilterDraft } from "./FilterBottomSheet";
import FoodMatchCard from "./FoodMatchCard";
import HomeHeader from "./HomeHeader";
import MaterialIcon from "./MaterialIcon";
import { fromRecommendation, type FoodMatch } from "./matchData";

type Status = "loading" | "ready" | "error";

function countChanges(a: FilterDraft, b: FilterDraft) {
  let changes = 0;
  if (a.budget !== b.budget) changes++;
  if (a.time !== b.time) changes++;
  if (a.transport !== b.transport) changes++;
  if ([...a.tags].sort().join() !== [...b.tags].sort().join()) changes++;
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

export default function HomePage() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [fetchedFor, setFetchedFor] = useState<FilterDraft | null>(null);
  const [matches, setMatches] = useState<FoodMatch[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");
  const latestRequest = useRef(0);

  const loadMatches = useCallback(async (filters: FilterDraft) => {
    const requestId = ++latestRequest.current;
    try {
      const data = await decide(toDecidePayload(filters));
      if (requestId !== latestRequest.current) return;
      setMatches(data.recommendations.map((rec, index) => fromRecommendation(rec, index, filters.budget)));
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
    void loadMatches(DEFAULT_FILTERS);
  }, [loadMatches]);

  const filtersChanged = fetchedFor ? countChanges(applied, fetchedFor) : 0;
  const stale = filtersChanged > 0;

  const applyFilters = () => {
    setApplied(draft);
    setSheetOpen(false);
    if (draft.mode === "group") router.push("/group");
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

  return (
    <div className="bg-[#f0f3f6] text-on-surface antialiased min-h-screen flex justify-center">
      <div className="w-full max-w-[420px] bg-background min-h-screen flex flex-col relative shadow-2xl">
        <HomeHeader
          budget={applied.budget}
          time={applied.time}
          transport={applied.transport}
          onOpenFilters={() => {
            setDraft(applied);
            setSheetOpen(true);
          }}
        />

        <main className="flex-1 px-3 pt-3 flex flex-col gap-3 pb-44">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                <MaterialIcon name="psychology" className="text-[15px]" />
              </div>
              <h2 className="text-[15px] font-extrabold text-on-surface tracking-tight">Gemini AI Top Matches</h2>
            </div>
            {status === "ready" ? (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E6F7ED] text-primary tabular-nums">
                {matches.length} Ready
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

          {status === "ready" && matches.length === 0 ? (
            <div className="rounded-2xl border border-[#E9ECEF] bg-surface-container-lowest p-4 text-center">
              <p className="text-sm font-bold">No matches for these filters</p>
              <p className="text-xs text-on-surface-variant mt-1">
                Try a higher budget, more time, or switch to Car / GrabBike.
              </p>
            </div>
          ) : null}

          <div className={`flex flex-col gap-3 transition-opacity ${status === "loading" ? "opacity-50" : ""}`}>
            {matches.map((match) => (
              <FoodMatchCard key={match.id} match={match} />
            ))}
          </div>
        </main>

        <BottomDock
          active="explore"
          actionBadge={status === "ready" ? `${matches.length} Options` : undefined}
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
