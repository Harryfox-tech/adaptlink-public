"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type GlassCardProps = React.ComponentPropsWithoutRef<"section">;

export const GlassCard = React.forwardRef<HTMLElement, GlassCardProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <section
        ref={ref}
        className={cn(
          "rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-md",
          "shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
          "ring-1 ring-white/5",
          "motion-safe:animate-fade-in-up neo-hover-float",
          className,
        )}
        {...props}
      >
        {children}
      </section>
    );
  },
);
GlassCard.displayName = "GlassCard";

