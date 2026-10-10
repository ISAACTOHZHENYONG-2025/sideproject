"use client";

import MaterialIcon from "@/components/ui/MaterialIcon";
import {
  BUDGET_RANGE,
  DEFAULT_FILTERS,
  DIET_TOGGLES,
  DISTANCE_OPTIONS,
  HALAL_OPTIONS,
  PREFERENCE_TAGS,
  type FilterDraft,
} from "@/lib/filters";

type FilterBottomSheetProps = {
  open: boolean;
  draft: FilterDraft;
  onChange: (next: FilterDraft) => void;
  onClose: () => void;
  onApply: () => void;
};

function budgetLabel(budget: number) {
  const tier = budget <= 10 ? "Bajet" : budget <= 18 ? "Standard" : "Feast";
  return `RM ${budget.toFixed(2)} (${tier})`;
}

const inputClass =
  "w-full h-12 pl-11 pr-11 rounded-xl bg-surface-container-lowest border border-[#DEE2E6] text-sm text-on-surface placeholder:text-[#ADB5BD] outline-none transition-shadow focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,177,79,0.15)] [&::-webkit-search-cancel-button]:hidden";

export default function FilterBottomSheet({
  open,
  draft,
  onChange,
  onClose,
  onApply,
}: FilterBottomSheetProps) {
  const renderTag = ({ id, label }: { id: string; label: string }) => {
    const active = draft.tags.includes(id);
    return (
      <button
        aria-pressed={active}
        className={`flex items-center gap-1 px-3 h-9 rounded-full text-xs transition-all active:scale-95 ${
          active
            ? "font-bold bg-[#E6F7ED] text-primary border-[1.5px] border-primary"
            : "font-semibold bg-surface-container-lowest text-[#1E2329] border border-[#E9ECEF] hover:bg-[#F1F3F5]"
        }`}
        key={id}
        onClick={() =>
          onChange({
            ...draft,
            tags: active ? draft.tags.filter((item) => item !== id) : [...draft.tags, id],
          })
        }
        type="button"
      >
        {active ? <MaterialIcon name="check" className="text-[15px]" /> : null}
        {label}
      </button>
    );
  };

  return (
    <>
      <button
        aria-hidden={!open}
        aria-label="Close filters"
        className={`fixed inset-0 bg-black/60 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <div
        aria-hidden={!open}
        aria-label="Dining and schedule filters"
        className={`fixed bottom-0 inset-x-0 max-w-[420px] mx-auto z-50 h-[82dvh] bg-surface-container-lowest rounded-t-[28px] shadow-[0_10px_30px_rgba(0,0,0,0.10)] flex flex-col overflow-hidden transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        id="bottom-sheet"
        role="dialog"
      >
        <div className="w-full pt-3 pb-1.5 flex justify-center shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-[#DEE2E6]" />
        </div>

        <div className="px-5 py-2.5 flex items-center justify-between border-b border-[#E9ECEF] shrink-0">
          <h2 className="text-[19px] font-bold tracking-tight text-on-surface">Dining &amp; Schedule Filters</h2>
          <button
            className="text-xs font-bold text-primary hover:text-primary-dark active:opacity-70 px-2 py-1 rounded transition-colors"
            onClick={() => onChange(DEFAULT_FILTERS)}
            type="button"
          >
            Clear All
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 pb-28 no-scrollbar">
          <div>
            <label className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5" htmlFor="craving-input">
              <MaterialIcon name="restaurant" className="text-primary text-[17px]" />
              What are you craving?
            </label>
            <div className="relative">
              <MaterialIcon
                name="search"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] text-[#6C757D] pointer-events-none"
              />
              <input
                autoComplete="off"
                className={inputClass}
                enterKeyHint="search"
                id="craving-input"
                maxLength={60}
                onChange={(event) => onChange({ ...draft, craving: event.target.value })}
                placeholder="Rice, noodles, fast food, mcd..."
                type="search"
                value={draft.craving}
              />
              {draft.craving ? (
                <button
                  aria-label="Clear craving"
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-[#6C757D] hover:bg-[#F1F3F5]"
                  onClick={() => onChange({ ...draft, craving: "" })}
                  type="button"
                >
                  <MaterialIcon name="close" className="text-[18px]" />
                </button>
              ) : null}
            </div>
            <p className="text-[11px] text-[#6C757D] mt-1.5 px-1">Leave empty for anything.</p>
          </div>

          <div className="p-3.5 rounded-2xl bg-background border border-[#E9ECEF]">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5" htmlFor="budget-input">
                <MaterialIcon name="payments" className="text-primary text-[17px]" />
                Budget Ceiling
              </label>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary text-white shadow-sm tabular-nums">
                {budgetLabel(draft.budget)}
              </span>
            </div>
            <input
              className="w-full accent-primary h-2 cursor-pointer my-2"
              id="budget-input"
              max={BUDGET_RANGE.max}
              min={BUDGET_RANGE.min}
              onChange={(event) => onChange({ ...draft, budget: Number(event.target.value) })}
              step={1}
              type="range"
              value={draft.budget}
            />
            <div className="flex justify-between text-[11px] font-semibold text-[#6C757D] px-0.5 tabular-nums">
              <span>RM 5 (Bajet)</span>
              <span className="font-bold">RM 15</span>
              <span>RM 30 (Feast)</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <MaterialIcon name="near_me" className="text-primary text-[17px]" />
              How far will you go?
            </p>
            <div className="grid grid-cols-4 gap-2">
              {DISTANCE_OPTIONS.map(({ km, label }) => {
                const selected = draft.maxDistanceKm === km;
                return (
                  <button
                    aria-pressed={selected}
                    className={`h-9 text-center rounded-full text-xs transition-all active:scale-95 tabular-nums ${
                      selected
                        ? "font-bold bg-primary text-white shadow-sm"
                        : "font-semibold bg-[#F1F3F5] text-[#495057] hover:bg-[#E9ECEF]"
                    }`}
                    key={label}
                    onClick={() => onChange({ ...draft, maxDistanceKm: km })}
                    type="button"
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#6C757D] mt-2 px-1">
              Measured from the campus centre. Google Maps gives your real route by walking, bus, LRT or car.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <MaterialIcon name="verified" className="text-primary text-[17px]" />
              Halal
            </p>
            <div className="flex flex-wrap gap-2">{HALAL_OPTIONS.map(renderTag)}</div>
            <p className="text-[11px] text-[#6C757D] mt-1.5 px-1">
              Pick one, both or neither. Both or neither shows everything. Venues still to be checked appear under See more.
            </p>
          </div>

          <div>
            <p className="text-xs font-bold text-on-surface mb-2 flex items-center gap-1.5">
              <MaterialIcon name="eco" className="text-primary text-[17px]" />
              Dietary &amp; Preference Tags
            </p>
            <div className="flex flex-wrap gap-2">{[...DIET_TOGGLES, ...PREFERENCE_TAGS].map(renderTag)}</div>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-4 bg-surface-container-lowest/95 backdrop-blur-md border-t border-[#E9ECEF] flex items-center gap-3">
          <button
            className="h-12 px-4 rounded-full text-xs font-bold text-[#1E2329] bg-[#F1F3F5] hover:bg-[#E9ECEF] active:scale-95 transition-all shrink-0"
            onClick={() => onChange(DEFAULT_FILTERS)}
            type="button"
          >
            Reset
          </button>
          <button
            className="flex-1 h-12 px-4 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-sm shadow-md shadow-primary/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            onClick={onApply}
            type="button"
          >
            <MaterialIcon name="search" className="text-[18px]" />
            <span>Apply Filters &amp; Find Meal</span>
          </button>
        </div>
      </div>
    </>
  );
}
