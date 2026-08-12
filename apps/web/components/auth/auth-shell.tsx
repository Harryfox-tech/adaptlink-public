"use client";

import * as React from "react";
import { GlassCard } from "@/components/neo/glass-card";
import { cn } from "@/lib/utils";

export function AuthShell({
  eyebrow = "AdaptLink 平台",
  title,
  description,
  children,
  className,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main className={cn("app-grain relative min-h-[100dvh] overflow-hidden px-4 py-10 md:py-14", className)}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[380px] w-[380px] rounded-full bg-sky-500/8 blur-3xl" />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-10 md:grid-cols-[1fr_420px] lg:grid-cols-[1.1fr_440px]">
        <section className="hidden md:flex md:flex-col md:justify-center">
          <p className="text-sm font-medium text-cyan-300/90">{eyebrow}</p>
          <h1 className="font-display mt-3 max-w-lg text-4xl font-semibold tracking-tight text-white md:text-[2.75rem] md:leading-[1.08]">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">{description}</p>
          <ul className="mt-8 space-y-3 text-sm text-white/55">
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
              学生端：成长模拟、求职训练、简历优化
            </li>
            <li className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/70" />
              企业 / 高校端：独立账号体系与开发者密钥
            </li>
          </ul>
        </section>

        <GlassCard className="quantum-scanline px-6 py-6 md:px-7 md:py-7">{children}</GlassCard>
      </div>
    </main>
  );
}
