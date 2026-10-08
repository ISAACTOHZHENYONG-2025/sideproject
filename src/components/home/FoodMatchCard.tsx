import MaterialIcon from "@/components/ui/MaterialIcon";
import type { FoodMatch } from "./foodMatch";

type FoodMatchCardProps = {
  match: FoodMatch;
};

const priceNoteClass = {
  amber: "text-amber-700 bg-amber-50",
  emerald: "text-emerald-700 bg-emerald-50",
  muted: "text-slate-500 bg-transparent px-0",
} as const;

export default function FoodMatchCard({ match }: FoodMatchCardProps) {
  const isTop = match.rank === 1;
  const stallClass =
    match.stallTone === "amber"
      ? "px-1.5 py-0.5 rounded bg-amber-100 text-[10px] font-bold text-amber-900"
      : "px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-semibold text-slate-600";

  return (
    <article className="bg-surface rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
      <div className="relative w-full h-36 bg-slate-100 border-b border-dashed border-slate-300 flex flex-col items-center justify-center group cursor-pointer hover:bg-slate-200/70 transition-colors">
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <MaterialIcon
            name="add_a_photo"
            className="text-3xl text-slate-400 group-hover:scale-110 transition-transform"
          />
          <span className="text-[11px] font-medium text-slate-500 mt-1">
            {match.rank === 1 ? "Tap to upload / set stall photo" : "Tap to upload stall photo"}
          </span>
        </div>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm text-[11px] font-bold text-slate-800">
          <MaterialIcon
            name={match.travelIcon}
            className={`text-[14px] ${match.travelIconTone === "amber" ? "text-amber-600" : "text-primary"}`}
          />
          <span>{match.travelLabel}</span>
        </div>
        <div
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold tracking-wide shadow-sm ${
            isTop ? "bg-emerald-500" : "bg-slate-700"
          }`}
        >
          #{match.rank} MATCH{match.fit ? ` • ${match.fit}%` : ""}
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[16px] font-bold text-on-surface leading-tight">{match.title}</h3>
              {match.stall ? <span className={stallClass}>{match.stall}</span> : null}
            </div>
            <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5">
              <MaterialIcon name={match.locationIcon} className="text-[13px] text-primary" />
              <span>{match.location}</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div
              className={`text-[18px] font-black leading-none ${
                match.priceNoteTone === "muted" ? "text-on-surface" : "text-primary"
              }`}
            >
              {match.price}
            </div>
            <span
              className={`text-[10px] font-semibold px-1 py-0.5 rounded inline-block mt-0.5 ${priceNoteClass[match.priceNoteTone]}`}
            >
              {match.priceNote}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <span className="text-[9px] uppercase tracking-wider font-bold text-primary block leading-none">
                {match.pickLabel}
              </span>
              <span className="text-[13px] font-bold text-on-surface truncate block">{match.pickName}</span>
            </div>
          </div>
          <div
            className={`text-right shrink-0 text-[11px] font-semibold text-slate-600 flex items-center gap-0.5 ${
              match.travelIconTone === "amber" ? "" : ""
            }`}
          >
            <MaterialIcon
              name="schedule"
              className={`text-[14px] ${match.travelIconTone === "amber" ? "text-amber-600" : "text-primary"}`}
            />
            <span>{match.duration}</span>
          </div>
        </div>

        <div className="rounded-xl p-2.5 bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-2">
          <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
          <p className="text-[12px] leading-snug">
            <strong className="text-amber-900 font-bold">Gemini Insight:</strong> {match.insight}
            {match.insightHighlight ? (
              <>
                <span className="font-bold text-emerald-700">{match.insightHighlight}</span>).
              </>
            ) : null}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            className="py-2.5 px-3 rounded-full bg-primary hover:bg-primary-dark text-white text-[12px] font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95 transition-transform"
            type="button"
          >
            <span>{match.primaryCta}</span>
            <MaterialIcon name="arrow_forward" className="text-[15px]" />
          </button>
          <button
            className="py-2.5 px-3 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-[12px] font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform"
            type="button"
          >
            <MaterialIcon name={match.secondaryIcon} className="text-[16px] text-primary" />
            <span>{match.secondaryCta}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
