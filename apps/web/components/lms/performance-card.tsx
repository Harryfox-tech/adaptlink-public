"use client";

import * as React from "react";
import { FaChevronDown } from "react-icons/fa";

const bars = [
  { value: 85.3, label: "Algorithms\nstructures", height: 64 },
  { value: 64.7, label: "Object\nprogram.", height: 48 },
  { value: 84.2, label: "Database\nprogram.", height: 62 },
  { value: 45.6, label: "Web\ndevelop.", height: 34 },
  { value: 43.5, label: "Mobile\napplication", height: 32 },
  { value: 74.4, label: "Machine\nlearning", height: 54 },
];

export function PerformanceCard() {
  return (
    <section className="quantum-glass-texture rounded-[18px] border border-white/10 bg-slate-950/45 px-5 py-4 shadow-[0_0_26px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="font-qdisplay text-[14px] font-semibold text-white/90">Performance</div>
        <button type="button" className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 font-quantum text-[12px] font-medium text-white/70">
          December <FaChevronDown className="h-3 w-3 text-white/50" />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <div className="font-quantum text-[12px] font-medium text-white/55">The best lessons:</div>
          <div className="mt-1 flex items-end gap-2">
            <div className="font-quantum text-[34px] font-semibold leading-none text-white/90">95.4</div>
            <div className="pb-1 font-quantum text-[11px] text-white/50">Introduction to programming</div>
          </div>
        </div>
        <button type="button" className="rounded-[12px] border border-white/10 bg-white/[0.03] px-4 py-2 font-quantum text-[12px] font-semibold text-white/80 hover:bg-white/[0.06]">
          All lessons
        </button>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-3">
        {bars.map((b) => (
          <div key={b.value} className="flex flex-col items-center">
            <div className="font-quantum text-[10px] font-semibold text-white/55">{b.value}</div>
            <div className="mt-2 flex h-[86px] w-full items-end justify-center">
              <div
                className="w-[14px] rounded-[10px] bg-gradient-to-b from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_14px_rgba(34,211,238,0.22)]"
                style={{ height: `${b.height}px` }}
              />
            </div>
            <div className="mt-2 whitespace-pre-line text-center font-quantum text-[10px] leading-[12px] text-white/55">
              {b.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

