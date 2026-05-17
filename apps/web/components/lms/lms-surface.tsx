"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function LmsSurface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[18px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md",
        "shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5",
        "motion-safe:animate-fade-in-up neo-hover-float",
        className,
      )}
    >
      {children}
    </section>
  );
}

