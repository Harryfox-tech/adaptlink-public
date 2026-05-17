"use client";

import { ArrowDownRight, ArrowRight, Minus } from "lucide-react";
import { AbilityDimension } from "@/lib/types";
import { NeoAbilityRadar } from "@/components/neo/neo-ability-radar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function trendText(trend: AbilityDimension["trend"]) {
  if (trend === "up") return "上升";
  if (trend === "down") return "下降";
  return "平稳";
}

function TrendGlyph({ trend }: { trend: AbilityDimension["trend"] }) {
  if (trend === "up") return <ArrowRight className="h-3.5 w-3.5 text-emerald-400" aria-hidden />;
  if (trend === "down") return <ArrowDownRight className="h-3.5 w-3.5 text-rose-400" aria-hidden />;
  return <Minus className="h-3.5 w-3.5 text-white/35" aria-hidden />;
}

const BENTO_ACCENT = [
  "border-cyan-400/20 shadow-[0_0_18px_rgba(34,211,238,0.08)]",
  "border-violet-400/20 shadow-[0_0_18px_rgba(167,139,250,0.08)]",
  "border-fuchsia-400/15 shadow-[0_0_18px_rgba(217,70,239,0.07)]",
  "border-sky-400/20 shadow-[0_0_18px_rgba(56,189,248,0.08)]",
  "border-emerald-400/18 shadow-[0_0_18px_rgba(52,211,153,0.08)]",
  "border-amber-400/18 shadow-[0_0_18px_rgba(251,191,36,0.07)]",
  "border-rose-400/18 shadow-[0_0_18px_rgba(251,113,133,0.07)]",
  "border-blue-400/20 shadow-[0_0_18px_rgba(96,165,250,0.08)]",
];

export function AbilityScoreCards({ abilities }: { abilities: AbilityDimension[] }) {
  const radarData = abilities.map((a) => ({
    subject: a.label.length > 5 ? `${a.label.slice(0, 5)}…` : a.label,
    score: a.score,
  }));
  const avg = Math.round(abilities.reduce((s, a) => s + a.score, 0) / Math.max(1, abilities.length));

  return (
    <Card className="overflow-hidden border-cyan-500/20 bg-slate-950/40 shadow-[0_0_60px_rgba(34,211,238,0.06)] backdrop-blur-xl">
      <CardHeader className="border-b border-white/[0.06] pb-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="space-y-1">
            <CardTitle className="text-xl tracking-tight">多维能力评估</CardTitle>
            <p className="text-sm text-white/50">模拟结束后的能力画像与结构分布</p>
          </div>
          <div className="relative text-right">
            <div
              className="pointer-events-none absolute -inset-6 rounded-full bg-cyan-400/10 blur-2xl"
              aria-hidden
            />
            <p className="relative text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">综合指数</p>
            <p className="relative bg-gradient-to-br from-cyan-200 via-white to-emerald-300/90 bg-clip-text font-mono text-5xl font-bold tabular-nums text-transparent drop-shadow-[0_0_30px_rgba(34,211,238,0.35)]">
              {avg}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 pt-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="rounded-[20px] border border-white/10 bg-white/[0.04] p-4 ring-1 ring-cyan-400/10">
          <NeoAbilityRadar title="能力雷达" data={radarData} className="h-[280px]" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {abilities.map((ability, i) => (
            <div
              key={ability.key}
              className={cn(
                "rounded-[14px] border bg-white/[0.04] p-3 backdrop-blur-sm transition-colors hover:bg-white/[0.06]",
                BENTO_ACCENT[i % BENTO_ACCENT.length],
              )}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <p className="text-[13px] font-medium leading-snug text-white/90">{ability.label}</p>
                <span className="flex items-center gap-1 rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] text-white/55">
                  <TrendGlyph trend={ability.trend} />
                  {trendText(ability.trend)}
                </span>
              </div>
              <div className="mb-1 flex items-baseline justify-between">
                <span className="font-mono text-2xl font-semibold tabular-nums text-white">{ability.score}</span>
                <span className="text-[11px] text-white/40">/ 100</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-400 shadow-[0_0_12px_rgba(34,211,238,0.35)]"
                  style={{ width: `${ability.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
