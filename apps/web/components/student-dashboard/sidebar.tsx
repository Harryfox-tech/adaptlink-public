"use client";

import { sidebarItems } from "@/components/student-dashboard/data";

export function DashboardSidebar() {
  return (
    <aside className="flex w-[240px] shrink-0 flex-col rounded-[24px] bg-brand p-5 text-white">
      <h2 className="mb-8 text-[30px] font-extrabold leading-none">Smart</h2>
      <nav className="space-y-2">
        {sidebarItems.map((item) => {
          const active = item === "Dashboard";
          return (
            <button
              key={item}
              type="button"
              className={`w-full rounded-xl px-4 py-2.5 text-left text-[15px] font-medium transition ${
                active ? "bg-white/15 text-white shadow-[0_0_18px_rgba(34,211,238,0.18)] border border-cyan-300/20" : "border border-transparent text-white/95 hover:bg-white/10 hover:border-white/10"
              }`}
            >
              {item}
            </button>
          );
        })}
      </nav>
      <button
        type="button"
        className="mt-auto rounded-xl px-4 py-2.5 text-left text-[15px] font-medium text-white/95 transition hover:bg-white/10"
      >
        Log Out
      </button>
    </aside>
  );
}
