"use client";

import * as React from "react";

export function NeoCanvas({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-[calc(100vh-7.5rem)] overflow-hidden rounded-[22px] bg-slate-950 p-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(45,212,191,0.08),transparent_55%),radial-gradient(900px_circle_at_75%_15%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(900px_circle_at_60%_85%,rgba(59,130,246,0.10),transparent_55%)]" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}

