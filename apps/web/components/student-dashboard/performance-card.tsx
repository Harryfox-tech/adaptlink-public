"use client";

import { FaChevronDown } from "react-icons/fa";
import { performanceBars } from "@/components/student-dashboard/data";

export function PerformanceCard() {
  return (
    <section className="quantum-glass-texture rounded-[20px] border border-white/10 bg-slate-950/45 p-6 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <h2 className="font-qdisplay text-[20px] font-bold text-white/90">Performance</h2>
        <button type="button" className="flex items-center gap-1 font-quantum text-[12px] font-semibold text-white/60 hover:text-cyan-200">
          December <FaChevronDown className="text-[9px]" />
        </button>
      </div>

      <p className="mt-3 font-quantum text-[13px] text-white/55">The best lessons:</p>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex items-end gap-3">
          <span className="font-quantum text-[54px] font-extrabold leading-[1] text-white/90">95.4</span>
          <span className="mb-2 max-w-[120px] font-quantum text-[12px] leading-4 text-white/50">Introduction to programming</span>
        </div>
        <button type="button" className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-1.5 font-quantum text-[12px] font-semibold text-cyan-200/90 hover:bg-white/[0.06]">
          All lessons
        </button>
      </div>

      <div className="mt-6 grid grid-cols-6 gap-2.5">
        {performanceBars.map((bar) => {
          const h = Math.max(44, (bar.value / 100) * 120);
          return (
            <div key={bar.label} className="text-center">
              <p className="mb-1 font-quantum text-[11px] font-semibold text-white/55">{bar.value.toFixed(1)}</p>
              <div className="mx-auto flex h-[120px] w-7 items-end">
                <div className="w-full rounded-t-md bg-gradient-to-b from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_14px_rgba(34,211,238,0.22)]" style={{ height: `${h}px` }} />
              </div>
              <p className="mt-2 font-quantum text-[10px] leading-3 text-white/50">{bar.label}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
