import MaterialIcon from "../home/MaterialIcon";
import type { GroupMatch } from "./groupData";

type GroupMatchCardProps = {
  match: GroupMatch;
};

const priceNoteClass = {
  strike: "text-[10px] text-on-surface-variant line-through block",
  primary: "text-[10px] text-primary font-bold block",
  muted: "text-[10px] text-on-surface-variant font-medium block",
} as const;

export default function GroupMatchCard({ match }: GroupMatchCardProps) {
  const isTop = match.rank === 1;
  const queueColor = match.queueTone === "primary" ? "text-primary" : "text-secondary";
  const queueDot = match.queueTone === "primary" ? "bg-primary-container" : "bg-secondary-container";
  const tagClass =
    match.tag?.tone === "secondary"
      ? "text-secondary-container bg-secondary"
      : "text-on-primary bg-primary";

  return (
    <article className="bg-surface-container-lowest rounded-2xl border border-[#E9ECEF] shadow-[0_2px_8px_rgba(30,35,41,0.04)] overflow-hidden flex flex-col transition-all hover:shadow-[0_6px_16px_rgba(30,35,41,0.08)] hover:border-[#DEE2E6]">
      <div className="relative w-full h-36 bg-surface-container-low flex flex-col items-center justify-center text-on-surface-variant group cursor-pointer border-b border-surface-container">
        <div className="flex flex-col items-center justify-center gap-1 text-center px-4">
          <MaterialIcon
            name="add_photo_alternate"
            className="text-3xl text-outline group-hover:scale-110 transition-transform"
          />
          <span className="text-[11px] font-medium text-on-surface-variant">
            Food / Stall Photo (Tap to upload)
          </span>
        </div>
        <div className="absolute top-2.5 left-2.5 bg-surface-container-lowest/95 backdrop-blur-md px-2 py-0.5 rounded-full text-on-surface shadow-xs flex items-center gap-1 border border-outline-variant/30">
          <MaterialIcon
            name={match.travelIcon}
            className={`text-[13px] ${match.travelIconTone === "primary" ? "text-primary" : "text-secondary"}`}
          />
          <span className="text-[10px] font-bold">{match.travelLabel}</span>
        </div>
        <div
          className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wide tabular-nums shadow-xs ${
            isTop
              ? "bg-primary-fixed text-on-primary-fixed-variant font-extrabold"
              : "bg-surface-container-highest text-on-surface-variant font-bold"
          }`}
        >
          #{match.rank} Match • {match.fit}% Fit
        </div>
      </div>

      <div className="p-3.5 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-bold text-base text-on-surface leading-tight">{match.title}</h2>
            <p className="text-xs text-on-surface-variant mt-0.5 flex items-center gap-1">
              <span>{match.stall}</span>
              <span>•</span>
              <span
                className={`text-[11px] ${
                  match.areaTone === "primary" ? "text-primary font-semibold" : "text-on-surface-variant"
                }`}
              >
                {match.area}
              </span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <div
              className={`text-lg font-black leading-tight tabular-nums ${
                match.priceTone === "primary" ? "text-primary" : "text-on-surface"
              }`}
            >
              {match.price}
            </div>
            <span className={priceNoteClass[match.priceNoteStyle]}>{match.priceNote}</span>
          </div>
        </div>

        <div className="bg-surface-container-low rounded-xl p-2.5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-xs text-on-surface truncate">{match.pickName}</span>
            {match.tag ? (
              <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-md shrink-0 ${tagClass}`}>
                {match.tag.label}
              </span>
            ) : null}
          </div>
          <div className="flex items-center justify-between text-[11px] font-semibold pt-0.5 border-t border-surface-container/60">
            <span className={`${queueColor} flex items-center gap-1 font-bold tabular-nums`}>
              <span className={`w-2 h-2 rounded-full ${queueDot}`} />
              {match.queueLabel}
            </span>
            <span className="text-on-surface-variant text-[10px] tabular-nums">{match.duration}</span>
          </div>
        </div>

        <div className="rounded-xl p-2.5 bg-secondary-fixed/30 border border-secondary-fixed/50 text-on-surface flex items-start gap-2">
          <span className="text-base shrink-0 leading-none mt-0.5">💡</span>
          <p className="text-[11px] leading-snug font-medium text-on-surface">
            <strong className="font-bold text-on-secondary-fixed">Gemini Pick:</strong> {match.insight}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <button
            className="w-full py-2 px-3 rounded-full bg-transparent border-[1.5px] border-primary text-primary hover:bg-[#F1F3F5] text-xs font-bold flex items-center justify-center gap-1 transition-all active:scale-95"
            type="button"
          >
            <MaterialIcon name={match.secondaryIcon} className="text-[15px] text-primary" />
            <span>{match.secondaryCta}</span>
          </button>
          <button
            className="w-full py-2 px-3 rounded-full bg-primary hover:bg-primary-dark text-on-primary text-xs font-bold flex items-center justify-center gap-1 shadow-xs transition-all active:scale-95"
            type="button"
          >
            <span>{match.primaryCta}</span>
            <MaterialIcon name="arrow_forward" className="text-[15px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
