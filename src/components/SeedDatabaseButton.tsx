"use client";

import { useState } from "react";
import { seedFirestoreDatabase } from "@/lib/seedFirebase";

export default function SeedDatabaseButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [feedback, setFeedback] = useState<string>("");

  const handleSeed = async () => {
    setStatus("loading");
    setFeedback("Connecting to Cloud Firestore and writing campus venues...");

    const result = await seedFirestoreDatabase();

    if (result.success) {
      setStatus("success");
      setFeedback(`Successfully seeded ${result.count} campus food spots into Firestore!`);
    } else {
      setStatus("error");
      setFeedback(result.error || "Failed to seed Firestore.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Admin Database Utility
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Populate Cloud Firestore with 7 UM campus dining spots (KK12, FOS, FCSIT, etc.)
        </p>
      </div>

      <button
        onClick={handleSeed}
        disabled={status === "loading"}
        className="w-full inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "loading" ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-white"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Seeding Firestore...
          </span>
        ) : (
          "🌱 Seed Campus Venues"
        )}
      </button>

      {status !== "idle" && (
        <div
          className={`mt-4 rounded-xl p-3 text-xs leading-relaxed ${
            status === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : status === "error"
              ? "bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
              : "bg-zinc-50 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
          }`}
        >
          {feedback}
        </div>
      )}
    </div>
  );
}

