"use client";

import { useRef, useState } from "react";

type DevPhotoUploadProps = {
  venueId: string;
  // Called once the server has saved the new file, so the card can reload its image.
  onUploaded: () => void;
};

/**
 * Developer-only "Upload photo" button, drawn over the card's photo. VenuePhoto renders it only under
 * `npm run dev`; the matching /api/dev/venue-photo route answers 404 anywhere else.
 */
export default function DevPhotoUpload({ venueId, onUploaded }: DevPhotoUploadProps) {
  const input = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "idle" | "busy" } | { kind: "error"; message: string }>({
    kind: "idle",
  });

  const upload = async (file: File) => {
    setStatus({ kind: "busy" });
    try {
      const body = new FormData();
      body.set("venueId", venueId);
      body.set("photo", file);
      const response = await fetch("/api/dev/venue-photo", { method: "POST", body });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? `Upload failed (${response.status}).`);
      }
      setStatus({ kind: "idle" });
      onUploaded();
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
    }
  };

  return (
    <>
      <input
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          // Clear the input so choosing the same file again still fires onChange.
          event.target.value = "";
          if (file) void upload(file);
        }}
        ref={input}
        type="file"
      />
      <button
        className="absolute bottom-2.5 right-2.5 max-w-[calc(100%-1.25rem)] truncate px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-900 backdrop-blur-sm text-white text-[11px] font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-70"
        disabled={status.kind === "busy"}
        onClick={() => input.current?.click()}
        title={status.kind === "error" ? status.message : "Dev only: save a photo for this venue"}
        type="button"
      >
        {status.kind === "busy" ? "Uploading…" : status.kind === "error" ? status.message : "Upload photo"}
      </button>
    </>
  );
}
