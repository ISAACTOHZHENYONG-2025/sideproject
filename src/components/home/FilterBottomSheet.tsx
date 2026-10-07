"use client";

import MaterialIcon from "./MaterialIcon";

export type FilterDraft = {
  budget: number;
  time: number;
  transport: "walk" | "drive";
  tags: string[];
};

type FilterBottomSheetProps = {
  open: boolean;
  draft: FilterDraft;
  onChange: (next: FilterDraft) => void;
  onClose: () => void;
  onApply: () => void;
};

const TIME_OPTIONS = [15, 30, 45, 60];
const DIET_TAGS = ["Halal", "Vegetarian", "No spicy", "High protein"];

export default function FilterBottomSheet({
  open,
  draft,
  onChange,
  onClose,
  onApply,
}: FilterBottomSheetProps) {
  return (
    <>
      <button
        aria-hidden={!open}
        aria-label="Close filters"
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        tabIndex={open ? 0 : -1}
        type="button"
      />
      <div
        aria-hidden={!open}
        className={`fixed bottom-0 inset-x-0 max-w-[420px] mx-auto z-50 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          open ? "translate-y-0" : "translate-y-full pointer-events-none"
        }`}
        id="bottom-sheet"
      >
        <div className="px-4 pt-3 pb-6">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-300" />
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-extrabold text-on-surface">Filters</h2>
            <button
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"
              onClick={onClose}
              type="button"
            >
              <MaterialIcon name="close" className="text-[18px]" />
            </button>
          </div>

          <label className="block mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-bold text-on-surface">Budget ceiling</span>
              <span className="text-[13px] font-extrabold text-primary">RM {Number(draft.budget).toFixed(2)}</span>
            </div>
            <input
              className="w-full accent-primary"
              max={30}
              min={5}
              onChange={(event) => onChange({ ...draft, budget: Number(event.target.value) })}
              step={1}
              type="range"
              value={draft.budget}
            />
          </label>

          <div className="mb-4">
            <p className="text-[13px] font-bold text-on-surface mb-2">Max time window</p>
            <div className="grid grid-cols-4 gap-2">
              {TIME_OPTIONS.map((minutes) => {
                const selected = draft.time === minutes;
                return (
                  <button
                    className={`py-2 text-center rounded-xl text-[12px] transition-all ${
                      selected
                        ? "font-bold bg-primary text-white shadow-sm"
                        : "font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    key={minutes}
                    onClick={() => onChange({ ...draft, time: minutes })}
                    type="button"
                  >
                    {minutes}m
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[13px] font-bold text-on-surface mb-2">Transport</p>
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              <button
                className={`py-2 rounded-lg text-[12px] flex items-center justify-center gap-1 ${
                  draft.transport === "walk"
                    ? "font-bold bg-white text-primary shadow-sm"
                    : "font-medium text-slate-600"
                }`}
                onClick={() => onChange({ ...draft, transport: "walk" })}
                type="button"
              >
                <span>🚶</span>
                Walk/Bus
              </button>
              <button
                className={`py-2 rounded-lg text-[12px] flex items-center justify-center gap-1 ${
                  draft.transport === "drive"
                    ? "font-bold bg-white text-primary shadow-sm"
                    : "font-medium text-slate-600"
                }`}
                onClick={() => onChange({ ...draft, transport: "drive" })}
                type="button"
              >
                <span>🚗</span>
                Car/Bike
              </button>
            </div>
          </div>

          <div className="mb-5">
            <p className="text-[13px] font-bold text-on-surface mb-2">Dietary</p>
            <div className="flex flex-wrap gap-1.5">
              {DIET_TAGS.map((tag) => {
                const active = draft.tags.includes(tag);
                return (
                  <button
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] ${
                      active
                        ? "font-bold bg-emerald-500 text-white shadow-sm"
                        : "font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                    key={tag}
                    onClick={() =>
                      onChange({
                        ...draft,
                        tags: active ? draft.tags.filter((item) => item !== tag) : [...draft.tags, tag],
                      })
                    }
                    type="button"
                  >
                    {active ? <MaterialIcon name="check" className="text-[13px]" /> : null}
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            className="w-full py-3 rounded-full bg-primary text-white text-[13px] font-extrabold shadow-lg shadow-emerald-500/25"
            onClick={onApply}
            type="button"
          >
            Apply filters
          </button>
        </div>
      </div>
    </>
  );
}
