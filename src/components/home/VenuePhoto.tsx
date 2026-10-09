"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { tileGradient, venuePhotoPath } from "@/lib/venueImage";

type VenuePhotoProps = {
  name: string;
  // The card's comma-joined `serves` string; only used to colour the fallback tile.
  foods?: string;
  // Set on the top match so its photo is fetched eagerly (Next 16 replaced `priority`).
  preload?: boolean;
  // Badge overlays, positioned absolutely against the 16:9 box.
  children?: ReactNode;
};

/**
 * The 16:9 top half of a venue card.
 *
 * A cuisine-coloured tile with the venue's initial sits underneath at all times, and the photo
 * fades in over it once it has decoded. So a venue with no file in `public/venues/` still gets a
 * full-height card, and a photo never pops in half-painted.
 */
export default function VenuePhoto({ name, foods, preload, children }: VenuePhotoProps) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={`relative aspect-video w-full overflow-hidden bg-gradient-to-br ${tileGradient(name, foods)}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center select-none text-[56px] font-black leading-none tracking-tight text-white/90"
      >
        {initial}
      </span>

      {state === "failed" ? null : (
        <Image
          alt={`${name} storefront`}
          className={`object-cover transition-opacity duration-300 ${
            state === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          fill
          onError={() => setState("failed")}
          onLoad={() => setState("loaded")}
          preload={preload}
          // A cached image can finish before React attaches onLoad/onError, so settle it here too.
          ref={(img) => {
            if (!img?.complete) return;
            setState(img.naturalWidth > 0 ? "loaded" : "failed");
          }}
          // The app shell is capped at 420px wide, so the card slot never exceeds that.
          sizes="(max-width: 420px) 100vw, 420px"
          src={venuePhotoPath(name)}
        />
      )}

      {children}
    </div>
  );
}
