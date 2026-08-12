import * as React from "react";
import { cn } from "@/lib/utils";

export function AuthAlert({
  tone,
  children,
}: {
  tone: "error" | "success" | "info";
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm leading-relaxed",
        tone === "error" && "border-rose-400/25 bg-rose-500/10 text-rose-100",
        tone === "success" && "border-emerald-400/25 bg-emerald-500/10 text-emerald-100",
        tone === "info" && "border-cyan-400/20 bg-cyan-500/10 text-cyan-100",
      )}
    >
      {children}
    </div>
  );
}
