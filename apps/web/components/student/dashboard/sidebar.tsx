"use client";

import { FaSignOutAlt } from "react-icons/fa";
import { sidebarItems } from "@/components/student/dashboard/data";

export function StudentDashboardSidebar() {
  return (
    <aside className="fixed left-0 top-0 z-20 flex h-screen w-[220px] flex-col bg-brand px-5 py-7 text-white">
      <h1 className="text-3xl font-extrabold leading-none">Smart</h1>

      <nav className="mt-10 space-y-2">
        {sidebarItems.map((item) => {
          const active = item === "Dashboard";
          return (
            <button
              key={item}
              className={
                active
                  ? "w-full rounded-xl border border-cyan-300/20 bg-white/15 px-4 py-2.5 text-left text-sm font-semibold text-white shadow-[0_0_18px_rgba(34,211,238,0.18)]"
                  : "w-full rounded-xl border border-transparent px-4 py-2.5 text-left text-sm font-semibold text-white/95 transition hover:border-white/10 hover:bg-white/10"
              }
            >
              {item}
            </button>
          );
        })}
      </nav>

      <button className="mt-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20">
        <FaSignOutAlt className="text-xs" />
        Log Out
      </button>
    </aside>
  );
}
