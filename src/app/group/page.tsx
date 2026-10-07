import GroupBottomBar from "@/components/group/GroupBottomBar";
import GroupMatchCard from "@/components/group/GroupMatchCard";
import { GROUP_MATCHES } from "@/components/group/groupData";
import MaterialIcon from "@/components/home/MaterialIcon";

export default function GroupPage() {
  return (
    <div className="bg-[#f0f3f6] text-on-surface antialiased min-h-screen flex justify-center">
      <div className="w-full max-w-[420px] bg-background min-h-screen flex flex-col relative shadow-2xl">
        <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-[#E9ECEF] px-4 pt-3 pb-3">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-[22px] font-extrabold tracking-tight text-primary">
              makan<span className="text-secondary">Apa</span>
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <button
                aria-label="Search"
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors"
                type="button"
              >
                <MaterialIcon name="search" className="text-[18px]" />
              </button>
              <button
                aria-label="Notifications"
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface relative transition-colors"
                type="button"
              >
                <MaterialIcon name="notifications" className="text-[18px]" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-container" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <div className="flex items-center gap-1.5 bg-surface-container-lowest border border-[#E9ECEF] rounded-full py-1 px-2.5 h-9 flex-1 min-w-0">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse shrink-0" />
              <span className="text-[11px] font-semibold text-on-surface truncate">
                ⚡ RM15 • ⏱️ 30m • 🚶 Walk • Halal
              </span>
              <button
                aria-label="Edit filters"
                className="ml-auto text-primary text-[11px] font-bold shrink-0 hover:underline"
                type="button"
              >
                Edit
              </button>
            </div>
            <button
              aria-label="Filters"
              className="shrink-0 p-1.5 rounded-full bg-surface-container text-on-surface hover:bg-surface-container-high transition-colors"
              type="button"
            >
              <MaterialIcon name="tune" className="text-[16px]" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-3.5 pt-3.5 flex flex-col gap-3.5 pb-44">
          <section className="bg-gradient-to-r from-secondary-fixed/40 via-surface-container-lowest to-primary-fixed/20 border border-secondary-container/40 rounded-2xl p-3 shadow-xs">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
                <span className="text-[11px] font-extrabold uppercase tracking-wide text-secondary flex items-center gap-1">
                  <MaterialIcon name="groups" className="text-[14px]" />
                  Group Consensus Active
                </span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-secondary-container text-on-secondary-container font-mono">
                #UM-892
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex -space-x-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                    A
                  </div>
                  <div className="w-7 h-7 rounded-full bg-secondary-fixed text-on-secondary-fixed font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                    S
                  </div>
                  <div className="w-7 h-7 rounded-full bg-primary text-on-primary font-bold text-[11px] flex items-center justify-center border-2 border-white shadow-xs">
                    You
                  </div>
                </div>
                <p className="text-xs font-semibold text-on-surface truncate tabular-nums">
                  3 friends voted • <span className="text-primary font-bold">1 spot ready</span>
                </p>
              </div>
              <button
                className="shrink-0 text-xs font-bold text-on-primary bg-primary-container hover:bg-primary px-3 py-1.5 rounded-full shadow-xs flex items-center gap-1 transition-all active:scale-95"
                type="button"
              >
                <span>View</span>
                <MaterialIcon name="arrow_forward" className="text-[13px]" />
              </button>
            </div>
          </section>

          <div className="flex items-center justify-between px-0.5 pt-1">
            <div className="flex items-center gap-1.5">
              <MaterialIcon name="psychology" className="text-primary text-[20px]" />
              <h1 className="font-bold text-sm text-on-surface">Gemini AI Recommendations</h1>
            </div>
            <span className="text-[11px] font-semibold text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
              {GROUP_MATCHES.length} Ranked Matches
            </span>
          </div>

          {GROUP_MATCHES.map((match) => (
            <GroupMatchCard key={match.id} match={match} />
          ))}
        </main>

        <GroupBottomBar filtersChanged={2} options={GROUP_MATCHES.length} />
      </div>
    </div>
  );
}
