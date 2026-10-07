"use client";

import { useState } from "react";
import FilterBottomSheet, { type FilterDraft } from "./FilterBottomSheet";
import FoodMatchCard from "./FoodMatchCard";
import GroupConsensusView from "./GroupConsensusView";
import HomeBottomBar from "./HomeBottomBar";
import HomeHeader from "./HomeHeader";
import MaterialIcon from "./MaterialIcon";
import { FOOD_MATCHES } from "./matchData";

const DEFAULT_FILTERS: FilterDraft = {
  budget: 15,
  time: 30,
  transport: "walk",
  tags: ["Halal"],
};

export default function HomePage() {
  const [mode, setMode] = useState<"single" | "group">("single");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [applied, setApplied] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [draft, setDraft] = useState<FilterDraft>(DEFAULT_FILTERS);
  const [filtersChanged, setFiltersChanged] = useState(2);

  const applyFilters = () => {
    setApplied(draft);
    setSheetOpen(false);
    setFiltersChanged(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="bg-[#f0f3f6] text-on-surface antialiased min-h-screen flex justify-center pb-28">
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

        <main className="flex-1 px-3 pt-3 flex flex-col gap-3 pb-28">
          {mode === "single" ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <MaterialIcon name="psychology" className="text-[15px]" />
                  </div>
                  <h2 className="text-[15px] font-extrabold text-on-surface tracking-tight">
                    Gemini AI Top Matches
                  </h2>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {FOOD_MATCHES.length} Ready
                </span>
              </div>
              {FOOD_MATCHES.map((match) => (
                <FoodMatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <GroupConsensusView />
          )}
        </main>

        <HomeBottomBar
          filtersChanged={filtersChanged}
          mode={mode}
          onSwitchMode={setMode}
          onUpdateResults={() => {
            applyFilters();
          }}
        />

        <FilterBottomSheet
          draft={draft}
          onApply={applyFilters}
          onChange={(next) => {
            setDraft(next);
            setFiltersChanged((count) => Math.max(count, 1));
          }}
          onClose={() => setSheetOpen(false)}
          open={sheetOpen}
        />
      </div>
    </div>
  );
}
