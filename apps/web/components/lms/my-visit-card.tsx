"use client";

import * as React from "react";
import { FaChevronDown } from "react-icons/fa";

const rings = [
  { value: 92, label: "Algorithms\nstructures" },
  { value: 83, label: "Object\nprogram." },
  { value: 78, label: "Database\nprogram." },
  { value: 97, label: "Web\ndevelop." },
  { value: 96, label: "Mobile\napplication" },
  { value: 89, label: "Machine\nlearning" },
];

function Ring({ value }: { value: number }) {
  return (
    <div
      className="relative flex h-[58px] w-[58px] items-center justify-center rounded-full"
      style={{
        background: `conic-gradient(rgba(34,211,238,0.95) ${value * 3.6}deg, rgba(255,255,255,0.10) 0deg)`,
      }}
    >
      <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full border border-white/10 bg-slate-950/55 backdrop-blur-md">
        <div className="font-quantum text-[12px] font-semibold text-white/90">{value}%</div>
      </div>
    </div>
  );
}

export function MyVisitCard() {
  return (
    <section className="quantum-glass-texture rounded-[18px] border border-white/10 bg-slate-950/45 px-5 py-4 shadow-[0_0_26px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="font-qdisplay text-[14px] font-semibold text-white/90">My visit</div>
        <button type="button" className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 font-quantum text-[12px] font-medium text-white/70">
          December <FaChevronDown className="h-3 w-3 text-white/50" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-5">
        {rings.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <Ring value={r.value} />
            <div className="whitespace-pre-line font-quantum text-[10px] leading-[12px] text-white/55">{r.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

