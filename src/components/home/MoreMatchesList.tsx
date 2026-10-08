import type { VenueMatch } from "@/app/api/decide/route";
import MaterialIcon from "@/components/ui/MaterialIcon";
import HalalBadge from "./HalalBadge";
import { distanceLabel } from "./foodMatch";

type MoreMatchesListProps = {
  matches: VenueMatch[];
};

export default function MoreMatchesList({ matches }: MoreMatchesListProps) {
  return (
    <ul className="bg-surface-container-lowest rounded-2xl border border-[#E9ECEF] shadow-[0_2px_8px_rgba(30,35,41,0.04)] divide-y divide-[#E9ECEF]">
      {matches.map((match, index) => {
        const distance = distanceLabel(match);
        return (
          <li className="flex items-center gap-3 px-4 py-3" key={`${index}-${match.venueName}`}>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[14px] font-bold text-on-surface truncate">{match.venueName}</p>
                {match.isHalal ? <HalalBadge /> : null}
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5 tabular-nums">
                <span className="font-bold text-primary">RM {match.estimatedCostMYR.toFixed(2)}</span>
                {" · "}
                {distance ?? match.travelMethod}
                {" · "}
                {match.estimatedTimeMins} min total
              </p>
            </div>
            <a
              aria-label={`Directions to ${match.venueName}`}
              className="shrink-0 h-9 px-3 rounded-full border-[1.5px] border-primary text-primary text-[12px] font-bold flex items-center gap-1 hover:bg-[#E6F7ED] active:scale-95 transition-transform"
              href={match.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MaterialIcon name="near_me" className="text-[15px]" />
              <span>Directions</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
