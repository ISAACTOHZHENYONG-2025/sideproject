import MaterialIcon from "@/components/ui/MaterialIcon";
import type { FilterDraft } from "@/lib/filters";
import { findLocation } from "@/lib/locations";

type HomeHeaderProps = {
  filters: FilterDraft;
  onOpenFilters: () => void;
};

const chipClass =
  "shrink-0 flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[12px] font-bold";

export default function HomeHeader({ filters, onOpenFilters }: HomeHeaderProps) {
  const craving = filters.craving.trim();

  return (
    <header className="sticky top-0 z-40 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.06)] px-4 pt-3 pb-2.5">
      <div className="flex items-center justify-between py-1">
        <div className="flex items-center py-0.5">
          <span className="text-[22px] font-extrabold tracking-tight text-primary">
            makan<span className="text-secondary">Apa</span>
          </span>
        </div>
      </div>

      <div className="mt-2.5 -mx-4 px-4 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-1">
        <button
          className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-on-surface text-white text-[12px] font-bold shadow-sm"
          onClick={onOpenFilters}
          type="button"
        >
          <MaterialIcon name="tune" className="text-[15px]" />
          <span>Filters</span>
        </button>
        {craving ? (
          <button className={chipClass} onClick={onOpenFilters} type="button">
            <MaterialIcon name="search" className="text-[13px] text-emerald-600" />
            <span className="max-w-[9rem] truncate">{craving}</span>
          </button>
        ) : null}
        <button className={chipClass} onClick={onOpenFilters} type="button">
          <MaterialIcon name="location_on" className="text-[13px] text-emerald-600" />
          <span>{findLocation(filters.locationId).label}</span>
        </button>
        <button className={`${chipClass} tabular-nums`} onClick={onOpenFilters} type="button">
          <span className="text-xs">⚡</span>
          <span>Max RM{filters.budget}</span>
        </button>
        <button className={`${chipClass} tabular-nums`} onClick={onOpenFilters} type="button">
          <span className="text-xs">⏱️</span>
          <span>{filters.time} mins</span>
        </button>
        <button className={chipClass} onClick={onOpenFilters} type="button">
          <span>{filters.transport === "walk" ? "🚶 Walk" : "🚗 Drive"}</span>
        </button>
        {filters.tags.includes("Halal") ? (
          <button className={chipClass} onClick={onOpenFilters} type="button">
            <MaterialIcon name="verified" className="text-[13px] text-emerald-600" />
            <span>Halal</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
