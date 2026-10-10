"use client";

import Image from "next/image";
import { useState, type ReactNode } from "react";
import { isValidVenueId, tileGradient, venuePhotoPath } from "@/lib/venueImage";
import DevPhotoUpload from "./DevPhotoUpload";

type VenuePhotoProps = {
  name: string;
  // Google Place ID / Firestore doc id: the photo is `public/venues/<venueId>.jpg`. Without one the card shows only the tile.
  venueId?: string;
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
export default function VenuePhoto({ name, venueId, foods, preload, children }: VenuePhotoProps) {
  const [state, setState] = useState<"loading" | "loaded" | "failed">("loading");
  // Set to the time of the latest dev upload, so the new file replaces the old one without a page reload.
  const [version, setVersion] = useState(0);
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const photoPath = venueId && isValidVenueId(venueId) ? venuePhotoPath(venueId) : undefined;

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

      {state === "failed" || !photoPath ? null : (
        <Image
          alt={`${name} storefront`}
          className={`object-cover transition-opacity duration-300 ${
            state === "loaded" ? "opacity-100" : "opacity-0"
          }`}
          fill
          key={version}
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
          src={version ? `${photoPath}?v=${version}` : photoPath}
          // Only in `npm run dev`: the optimizer keeps serving a replaced photo from its cache for hours, and
          // next.config.ts bars query strings, so dev loads the file as it is. Always false in production.
          unoptimized={process.env.NODE_ENV === "development"}
        />
      )}

      {children}

      {process.env.NODE_ENV === "development" && venueId && photoPath ? (
        <DevPhotoUpload
          onUploaded={() => {
            setState("loading");
            setVersion(Date.now());
          }}
          venueId={venueId}
        />
      ) : null}
    </div>
  );
}
