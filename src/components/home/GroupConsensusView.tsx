"use client";

import { useState } from "react";
import MaterialIcon from "./MaterialIcon";

export default function GroupConsensusView() {
  const [agreeLabel, setAgreeLabel] = useState("Agree (2)");
  const [agreeActive, setAgreeActive] = useState(false);
  const [rerollLabel, setRerollLabel] = useState("Reroll");
  const [rerollActive, setRerollActive] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-surface rounded-2xl p-3.5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
            Room Active
          </span>
          <span className="text-[12px] font-mono font-extrabold text-primary">#UM-892</span>
        </div>
        <h3 className="text-[16px] font-extrabold text-on-surface mt-1">Group Consensus Session</h3>
        <p className="text-[12px] text-on-surface-variant mt-0.5">
          3 friends joined • Balances budgets, transport, and dietary needs into 1 spot.
        </p>
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-rose-100 text-rose-800 text-[11px] font-bold flex items-center justify-center">
              A
            </div>
            <span className="text-[11px] font-bold block mt-1 truncate">Alex</span>
            <span className="text-[9px] text-slate-500">Max RM10 • Walk</span>
          </div>
          <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold flex items-center justify-center">
              S
            </div>
            <span className="text-[11px] font-bold block mt-1 truncate">Sarah</span>
            <span className="text-[9px] text-slate-500">RM20 • Car 🚗</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-xl text-center">
            <div className="w-7 h-7 mx-auto rounded-full bg-primary text-white text-[11px] font-bold flex items-center justify-center">
              You
            </div>
            <span className="text-[11px] font-bold block mt-1 truncate text-emerald-950">Arif (Host)</span>
            <span className="text-[9px] text-emerald-700">RM15 • Halal</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-primary/30 relative overflow-hidden">
        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase mb-2">
          <MaterialIcon name="stars" className="text-[13px]" />
          <span>Gemini Consensus Pick</span>
        </div>
        <h3 className="text-[18px] font-black text-on-surface">Kompleks Siswa Food Court</h3>
        <p className="text-[12px] text-on-surface-variant mt-0.5">
          Central Hub Level 1 • Equidistant walk for Alex & Arif, easy parking for Sarah.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            ✓ Matches RM6-18 budgets
          </span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
            ✓ 100% Halal Verified
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
            👥 6-Seater Tables Open
          </span>
        </div>
        <div className="mt-3 bg-slate-50 p-2.5 rounded-xl text-[12px] text-slate-700">
          <strong>Vote on this recommendation:</strong>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              className={`py-2 px-2 rounded-full font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 ${
                agreeActive ? "bg-emerald-600 text-white" : "bg-emerald-100 text-emerald-900"
              }`}
              onClick={() => {
                setAgreeActive(true);
                setAgreeLabel("Agreed (3)");
              }}
              type="button"
            >
              <MaterialIcon name="thumb_up" className="text-[14px]" />
              <span>{agreeLabel}</span>
            </button>
            <button
              className={`py-2 px-2 rounded-full font-bold text-[11px] flex items-center justify-center gap-1 active:scale-95 ${
                rerollActive ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
              }`}
              onClick={() => {
                setRerollActive(true);
                setRerollLabel("Recalculating...");
              }}
              type="button"
            >
              <MaterialIcon name="refresh" className="text-[14px]" />
              <span>{rerollLabel}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
