import Link from "next/link";
import MaterialIcon from "../home/MaterialIcon";

type GroupBottomBarProps = {
  filtersChanged: number;
  options: number;
};

export default function GroupBottomBar({ filtersChanged, options }: GroupBottomBarProps) {
  const stale = filtersChanged > 0;

  return (
    <div className="fixed bottom-0 inset-x-0 max-w-[420px] mx-auto z-40 pointer-events-none flex flex-col">
      <button
        className={`pointer-events-auto w-[calc(100%-2rem)] h-[52px] mx-auto mb-4 px-4 rounded-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-on-primary font-bold text-sm flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-all ${
          stale ? "animate-pulse" : ""
        }`}
        type="button"
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden>⚡</span>
          <span>{stale ? `Update Results (${filtersChanged} Filters Changed)` : "Find My Optimal Meal"}</span>
        </span>
        <span className="bg-black/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full tabular-nums">
          {options} Options
        </span>
      </button>
      <nav className="pointer-events-auto grid grid-cols-2 items-center bg-surface-container-lowest border-t border-[#E9ECEF] shadow-[0_10px_30px_rgba(0,0,0,0.10)] px-3 pt-2 pb-4">
        <Link className="flex flex-col items-center gap-0.5 text-on-surface-variant hover:text-on-surface" href="/">
          <MaterialIcon name="explore" className="text-[22px]" />
          <span className="text-[11px] font-medium tracking-tight">Explore</span>
        </Link>
        <Link className="flex flex-col items-center gap-0.5 text-primary relative" href="/group">
          <MaterialIcon name="groups" className="text-[22px]" />
          <span className="absolute top-0 right-5 w-2 h-2 rounded-full bg-secondary-container" />
          <span className="text-[11px] font-bold tracking-tight">Group</span>
        </Link>
      </nav>
    </div>
  );
}
