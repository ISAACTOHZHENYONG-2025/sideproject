"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import FilterBottomSheet, { DEFAULT_FILTERS, type FilterDraft } from "@/components/home/FilterBottomSheet";

export default function FilterPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<FilterDraft>(DEFAULT_FILTERS);

  return (
    <div className="bg-[#f0f3f6] min-h-screen">
      <FilterBottomSheet
        draft={draft}
        onApply={() => router.push(draft.mode === "group" ? "/group" : "/")}
        onChange={setDraft}
        onClose={() => router.back()}
        open
      />
    </div>
  );
}
