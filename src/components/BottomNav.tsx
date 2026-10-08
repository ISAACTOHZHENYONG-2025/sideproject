import Link from "next/link";
import MaterialIcon from "./home/MaterialIcon";

type BottomDockProps = {
  active: "explore" | "group";
  actionLabel?: string;
  actionBadge?: string;
  pulse?: boolean;
  disabled?: boolean;
  onAction?: () => void;
};

export default function BottomDock({
  active,
  actionLabel,
  actionBadge,
  pulse = false,
  disabled = false,
  onAction,
}: BottomDockProps) {
  return (
    <div className="fixed bottom-0 inset-x-0 max-w-[420px] mx-auto z-40 pointer-events-none flex flex-col">
      {actionLabel ? (
        <button
          className={`pointer-events-auto w-[calc(100%-2rem)] h-[52px] mx-auto mb-4 px-4 rounded-full bg-primary hover:bg-primary-dark active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100 text-on-primary font-bold text-sm flex items-center justify-between shadow-[0_10px_30px_rgba(0,0,0,0.10)] transition-all ${
            pulse && !disabled ? "animate-pulse" : ""
          }`}
          disabled={disabled}
          onClick={onAction}
          type="button"
        >
          <span className="flex items-center gap-1.5">
            <span aria-hidden>⚡</span>
            <span>{actionLabel}</span>
          </span>
          {actionBadge ? (
            <span className="bg-black/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full tabular-nums">
              {actionBadge}
            </span>
          ) : null}
        </button>
      ) : null}
      <nav className="pointer-events-auto grid grid-cols-2 items-center bg-surface-container-lowest border-t border-[#E9ECEF] shadow-[0_10px_30px_rgba(0,0,0,0.10)] px-3 pt-2 pb-4">
        <Link
          className={`flex flex-col items-center gap-0.5 ${
            active === "explore" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
          href="/"
        >
          <MaterialIcon name="explore" className="text-[22px]" />
          <span className={`text-[11px] tracking-tight ${active === "explore" ? "font-bold" : "font-medium"}`}>
            Explore
          </span>
        </Link>
        <Link
          className={`flex flex-col items-center gap-0.5 relative ${
            active === "group" ? "text-primary" : "text-on-surface-variant hover:text-on-surface"
          }`}
          href="/group"
        >
          <MaterialIcon name="groups" className="text-[22px]" />
          <span className={`text-[11px] tracking-tight ${active === "group" ? "font-bold" : "font-medium"}`}>
            Group
          </span>
        </Link>
      </nav>
    </div>
  );
}
