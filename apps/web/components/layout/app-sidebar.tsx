"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { platformNavMap, platformRoleName } from "@/lib/platform-nav";
import { PlatformRole } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AppSidebar({ role, pathname }: { role: PlatformRole; pathname: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/login?role=${role}`);
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <aside className="surface-panel sticky top-[5.75rem] hidden h-[calc(100dvh-7rem)] w-[248px] shrink-0 flex-col p-4 lg:flex">
      <div className="mb-5 border-b border-white/10 pb-4">
        <p className="font-display text-sm font-semibold text-white">AdaptLink</p>
        <p className="mt-0.5 text-xs text-white/50">{platformRoleName[role]}</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {platformNavMap[role].map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-xl px-3.5 py-2.5 text-[13px] font-medium transition duration-200",
                active
                  ? "border border-cyan-400/20 bg-cyan-500/10 text-white shadow-glow"
                  : "border border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => void logout()}
        disabled={loggingOut}
        className={cn(
          "mt-3 rounded-xl border px-3.5 py-2.5 text-left text-[13px] font-medium transition duration-200",
          loggingOut
            ? "border-white/10 bg-white/[0.03] text-white/50"
            : "border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.06] hover:text-white active:scale-[0.98]",
        )}
      >
        {loggingOut ? "退出中..." : "退出登录"}
      </button>
    </aside>
  );
}
