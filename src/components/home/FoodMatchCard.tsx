import MaterialIcon from "@/components/ui/MaterialIcon";
import DietBadges from "./DietBadges";
import type { FoodMatch } from "./foodMatch";

type FoodMatchCardProps = {
  match: FoodMatch;
  insightLabel: string;
};

export default function FoodMatchCard({ match, insightLabel }: FoodMatchCardProps) {
  const isTop = match.rank === 1;

  return (
    <article className="bg-surface rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col">
      <div className="relative w-full h-36 bg-slate-100 border-b border-dashed border-slate-300 flex flex-col items-center justify-center group cursor-pointer hover:bg-slate-200/70 transition-colors">
        <div className="flex flex-col items-center justify-center p-3 text-center">
          <MaterialIcon
            name="add_a_photo"
            className="text-3xl text-slate-400 group-hover:scale-110 transition-transform"
          />
          <span className="text-[11px] font-medium text-slate-500 mt-1">Tap to upload stall photo</span>
        </div>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-sm text-[11px] font-bold text-slate-800 tabular-nums">
          <MaterialIcon name={match.travelIcon} className="text-[14px] text-primary" />
          <span>{match.travelLabel}</span>
        </div>
        <div
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-white text-[10px] font-extrabold tracking-wide shadow-sm ${
            isTop ? "bg-emerald-500" : "bg-slate-700"
          }`}
        >
          #{match.rank} MATCH
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[16px] font-bold text-on-surface leading-tight">{match.title}</h3>
              <DietBadges isHalal={match.isHalal} isVegan={match.isVegan} isVegetarian={match.isVegetarian} />
            </div>
            {match.distanceLabel ? (
              <p className="text-[11px] text-on-surface-variant flex items-center gap-1 mt-0.5 tabular-nums">
                <MaterialIcon name="location_on" className="text-[13px] text-primary" />
                <span>{match.distanceLabel}</span>
              </p>
            ) : null}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[18px] font-black leading-none text-primary tabular-nums">{match.price}</div>
            <span className="text-[10px] font-semibold px-1 py-0.5 rounded inline-block mt-0.5 text-emerald-700 bg-emerald-50 tabular-nums">
              {match.priceNote}
            </span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex items-center justify-between gap-2">
          <div className="min-w-0">
            {match.serves ? (
              <>
                <span className="text-[9px] uppercase tracking-wider font-bold text-primary block leading-none">
                  Serves
                </span>
                <span className="text-[13px] font-bold text-on-surface truncate block capitalize">{match.serves}</span>
              </>
            ) : (
              <span className="text-[11px] font-semibold text-slate-500">Typical meal price shown</span>
            )}
          </div>
          <div className="text-right shrink-0 text-[11px] font-semibold text-slate-600 flex items-center gap-0.5 tabular-nums">
            <MaterialIcon name="schedule" className="text-[14px] text-primary" />
            <span>{match.duration}</span>
          </div>
        </div>

        <div className="rounded-xl p-2.5 bg-amber-50/80 border border-amber-200 text-amber-950 flex items-start gap-2">
          <span className="text-base leading-none shrink-0 mt-0.5">💡</span>
          <p className="text-[12px] leading-snug">
            <strong className="text-amber-900 font-bold">{insightLabel}:</strong> {match.insight}
          </p>
        </div>

        {match.allergyNotes ? (
          <div className="rounded-xl p-2.5 bg-[#FBE9E7] border border-[#FF5722]/30 text-[#D84315] flex items-start gap-2">
            <MaterialIcon name="warning" className="text-[16px] shrink-0 mt-0.5" />
            <p className="text-[12px] leading-snug">
              <strong className="font-bold">Allergy note:</strong> {match.allergyNotes}
            </p>
          </div>
        ) : null}

        <a
          className="h-11 px-3 rounded-full bg-primary hover:bg-primary-dark text-white text-[13px] font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          href={match.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MaterialIcon name="near_me" className="text-[17px]" />
          <span>Directions</span>
        </a>
      </div>
    </article>
  );
}
