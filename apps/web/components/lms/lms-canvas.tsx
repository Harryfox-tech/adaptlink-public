"use client";

import * as React from "react";

export function LmsCanvas({
  title,
  modeLabel = "Light mode",
  children,
}: {
  title: string;
  modeLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-950 px-8 py-10">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(45,212,191,0.08),transparent_55%),radial-gradient(900px_circle_at_75%_15%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(900px_circle_at_60%_85%,rgba(59,130,246,0.10),transparent_55%)]" />
      </div>
      <div className="relative mx-auto w-[1120px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-[42px] font-semibold text-white">{title}</div>
          <div className="rounded-full border border-white/10 bg-white/5 px-5 py-2 text-[13px] font-medium text-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.12)]">
            {modeLabel}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

