"use client";

import * as React from "react";

export function LmsCanvas({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-slate-950 px-8 py-10">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[560px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(45,212,191,0.08),transparent_55%),radial-gradient(900px_circle_at_75%_15%,rgba(14,165,233,0.08),transparent_55%),radial-gradient(900px_circle_at_60%_85%,rgba(34,211,238,0.06),transparent_55%)]" />
      </div>
      <div className="relative mx-auto w-[1120px]">
        <div className="mb-8">
          <div className="font-qdisplay text-[42px] font-semibold text-white">{title}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

