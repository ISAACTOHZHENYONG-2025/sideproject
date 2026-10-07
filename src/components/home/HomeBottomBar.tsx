import MaterialIcon from "./MaterialIcon";

type HomeBottomBarProps = {
  mode: "single" | "group";
  filtersChanged: number;
  onSwitchMode: (mode: "single" | "group") => void;
  onUpdateResults: () => void;
};

export default function HomeBottomBar({
  mode,
  filtersChanged,
  onSwitchMode,
  onUpdateResults,
}: HomeBottomBarProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 max-w-[420px] mx-auto z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="px-4 pt-2.5 pb-2">
        <button
          className="w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary-dark active:scale-[0.98] text-white font-extrabold text-[13px] flex items-center justify-between shadow-lg shadow-emerald-500/25 transition-all"
          onClick={onUpdateResults}
          type="button"
        >
          <div className="flex items-center gap-1.5">
            <MaterialIcon name="bolt" className="text-[18px] text-amber-400" />
            <span className="tracking-tight font-extrabold">Update Results</span>
          </div>
          <span className="bg-black/20 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
            {filtersChanged} Filters Changed
          </span>
        </button>
      </div>
      <nav className="flex items-center justify-around border-t border-slate-100 py-1.5 px-6 bg-surface">
        <button
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 cursor-pointer ${
            mode === "single" ? "text-primary" : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => onSwitchMode("single")}
          type="button"
        >
          <MaterialIcon name="explore" className="text-[22px]" />
          <span className={`text-[11px] leading-none ${mode === "single" ? "font-bold" : "font-medium"}`}>
            Explore
          </span>
        </button>
        <button
          className={`flex flex-col items-center justify-center gap-0.5 py-1 px-4 relative cursor-pointer ${
            mode === "group" ? "text-primary" : "text-slate-500 hover:text-slate-800"
          }`}
          onClick={() => onSwitchMode("group")}
          type="button"
        >
          <span className="relative inline-block">
            <MaterialIcon name="group" className="text-[22px]" />
            <span className="absolute -top-1 -right-2 bg-amber-400 text-amber-950 text-[9px] font-black px-1 rounded-full leading-tight">
              3
            </span>
          </span>
          <span className={`text-[11px] leading-none ${mode === "group" ? "font-bold" : "font-medium"}`}>
            Group Room
          </span>
        </button>
      </nav>
    </div>
  );
}
