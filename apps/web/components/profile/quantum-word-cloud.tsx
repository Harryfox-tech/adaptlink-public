"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type CloudWord = { word: string; size: number; tone: "good" | "warn" | "neutral" };

const tabs = [
  { id: "good", label: "Advantage Tags" },
  { id: "warn", label: "To Be Improved" },
  { id: "neutral", label: "Suggestion from" },
] as const;

export function QuantumWordCloud({ words }: { words: CloudWord[] }) {
  const [active, setActive] = React.useState<(typeof tabs)[number]["id"]>("good");
  const filtered = words.filter((w) => w.tone === active);

  return (
    <div className="quantum-glass-texture relative overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/45 p-4 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_70%_20%,rgba(34,211,238,0.10),transparent_55%)]" />
      <div className="relative z-[1]">
        <p className="mb-3 font-qdisplay text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">Word Cloud</p>
        <div className="mb-4 inline-flex rounded-full border border-white/10 bg-black/25 p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={cn(
                "rounded-full px-3 py-1.5 font-quantum text-[11px] transition",
                active === t.id
                  ? "bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.14)]"
                  : "text-white/55 hover:text-white/80",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative min-h-[190px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-black/20 p-4">
          <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:28px_28px]" />
          <div className="relative z-[1] flex flex-wrap items-center gap-x-4 gap-y-3 leading-none">
            {(filtered.length ? filtered : words.slice(0, 10)).map((item, idx) => (
              <span
                key={`${item.word}-${idx}`}
                className={cn(
                  "font-quantum",
                  item.tone === "good"
                    ? "font-semibold text-cyan-200/90 drop-shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : item.tone === "warn"
                      ? "font-semibold text-orange-200/85 drop-shadow-[0_0_12px_rgba(249,115,22,0.18)]"
                      : "font-medium text-violet-200/80 drop-shadow-[0_0_12px_rgba(168,85,247,0.18)]",
                )}
                style={{ fontSize: `${item.size}px` }}
              >
                {item.word}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

