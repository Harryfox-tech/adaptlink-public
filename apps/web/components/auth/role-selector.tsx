"use client";

import type { PlatformRole } from "@/lib/types";
import { cn } from "@/lib/utils";

const roles: { key: PlatformRole; label: string }[] = [
  { key: "student", label: "学生端" },
  { key: "enterprise", label: "企业端" },
  { key: "school", label: "高校端" },
];

export function RoleSelector({
  value,
  onChange,
}: {
  value: PlatformRole;
  onChange: (role: PlatformRole) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/40 p-1">
      {roles.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onChange(item.key)}
          className={cn(
            "rounded-xl px-2 py-2.5 text-sm font-medium transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/40",
            value === item.key
              ? "bg-cyan-500/20 text-cyan-100 shadow-[0_0_16px_rgba(34,211,238,0.12)]"
              : "text-white/55 hover:bg-white/5 hover:text-white/80",
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
