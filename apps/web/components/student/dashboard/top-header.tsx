"use client";

import { FaBell, FaChevronDown, FaRegBell, FaSearch } from "react-icons/fa";

export function StudentDashboardHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-[74px] items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-6 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md">
      <label className="flex h-11 w-[320px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 font-quantum text-white/55">
        <FaSearch className="text-sm" />
        <input className="w-full bg-transparent text-sm text-white/80 outline-none placeholder:text-white/35" placeholder="Search" />
      </label>

      <div className="flex items-center gap-5 font-quantum text-white/70">
        <button className="flex items-center gap-1 text-sm font-semibold hover:text-cyan-200">
          ENG <FaChevronDown className="text-[10px]" />
        </button>
        <button className="hover:text-cyan-200"><FaRegBell /></button>
        <button className="hover:text-cyan-200"><FaBell /></button>
        <button className="flex items-center gap-2 hover:text-cyan-200">
          <span className="h-8 w-8 rounded-full bg-[url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop')] bg-cover bg-center" />
          <span className="text-sm font-semibold text-white/85">Grace Stanley</span>
          <FaChevronDown className="text-[10px]" />
        </button>
      </div>
    </header>
  );
}
