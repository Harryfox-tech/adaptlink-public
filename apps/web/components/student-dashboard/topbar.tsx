"use client";

import { FaChevronDown, FaRegBell, FaRegCommentDots, FaSearch } from "react-icons/fa";

export function DashboardTopbar() {
  return (
    <header className="flex h-[72px] items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <label className="flex h-11 w-[340px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-quantum text-white/60">
        <FaSearch className="text-[14px]" />
        <input className="w-full bg-transparent text-[14px] text-white/80 outline-none placeholder:text-white/35" placeholder="Search" />
      </label>

      <div className="flex items-center gap-5 font-quantum text-white/70">
        <button type="button" className="flex items-center gap-1 text-[14px] font-semibold hover:text-cyan-200">
          ENG
          <FaChevronDown className="text-[10px]" />
        </button>
        <button type="button" className="hover:text-cyan-200"><FaRegCommentDots className="text-[18px]" /></button>
        <button type="button" className="hover:text-cyan-200"><FaRegBell className="text-[18px]" /></button>
        <button type="button" className="flex items-center gap-2 hover:text-cyan-200">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[13px] font-bold text-cyan-200">GS</span>
          <span className="text-[14px] font-semibold text-white/85">Grace Stanley</span>
          <FaChevronDown className="text-[10px]" />
        </button>
      </div>
    </header>
  );
}
