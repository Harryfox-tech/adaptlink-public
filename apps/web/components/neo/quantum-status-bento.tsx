"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { ChevronRight, Cpu } from "lucide-react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { CyberMonitorSection, RhythmRing } from "@/components/neo/neo-cyber-monitor";
import { cn } from "@/lib/utils";

/** 实时模拟指标：三轴迷你雷达（信心 / 压力 / 精力） */
export function QuantumCompetencyRadar({
  confidence,
  pressure,
  energy,
  readiness,
  className,
}: {
  confidence: number;
  pressure: number;
  energy: number;
  readiness: number;
  className?: string;
}) {
  const gid = React.useId().replace(/:/g, "");
  const fillId = `qRadar-${gid}`;
  const data = [
    { subject: "信心", score: Math.max(0, Math.min(100, confidence)) },
    { subject: "压力", score: Math.max(0, Math.min(100, pressure)) },
    { subject: "精力", score: Math.max(0, Math.min(100, energy)) },
    { subject: "准备", score: Math.max(0, Math.min(100, readiness)) },
  ];

  return (
    <div
      className={cn(
        "quantum-glass-texture relative overflow-hidden rounded-[18px] border border-cyan-500/30 bg-slate-950/50 p-4 shadow-[0_0_28px_rgba(34,211,238,0.12)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/10 blur-2xl" />
      <div className="relative mb-3 flex items-center gap-2">
        <Cpu className="h-4 w-4 text-cyan-300/90" aria-hidden />
        <div>
          <p className="font-qdisplay text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/90">实时模拟指标</p>
          <p className="font-quantum text-[10px] text-white/40">实时数据</p>
        </div>
      </div>
      <div className="relative h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="54%" outerRadius="72%" data={data}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgb(34 211 238)" stopOpacity={0.35} />
                <stop offset="50%" stopColor="rgb(59 130 246)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="rgb(249 115 22)" stopOpacity={0.28} />
              </linearGradient>
            </defs>
            <PolarGrid stroke="rgba(255,255,255,0.12)" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 11 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              dataKey="score"
              stroke="rgba(34,211,238,0.9)"
              fill={`url(#${fillId})`}
              fillOpacity={1}
              strokeWidth={1.5}
              dot={{ r: 4, fill: "rgba(34,211,238,0.95)", strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-3 font-quantum text-[10px] text-white/50 sm:grid-cols-4">
        <div className="text-center">
          <span className="text-cyan-300/90">信心</span>
          <div className="tabular-nums text-white/85">{Math.round(confidence)}</div>
        </div>
        <div className="text-center">
          <span className="text-orange-300/90">压力</span>
          <div className="tabular-nums text-white/85">{Math.round(pressure)}</div>
        </div>
        <div className="text-center">
          <span className="text-violet-300/90">精力</span>
          <div className="tabular-nums text-white/85">{Math.round(energy)}</div>
        </div>
        <div className="text-center">
          <span className="text-sky-300/90">准备</span>
          <div className="tabular-nums text-white/85">{Math.round(readiness)}</div>
        </div>
      </div>
    </div>
  );
}

/** 时间线风格即时建议（数据与 SimulatorTipsSticky 同源） */
export function QuantumActionTimeline({ tips }: { tips: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-purple-500/25 bg-slate-950/45 p-4 shadow-[0_0_26px_rgba(168,85,247,0.1)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-y-4 left-[19px] w-px bg-gradient-to-b from-cyan-400/40 via-fuchsia-400/30 to-transparent" aria-hidden />
      <p className="mb-4 font-qdisplay text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">即时建议报告</p>
      <ul className="space-y-3">
        {tips.map((tip, i) => {
          const title = tip.length > 22 ? `${tip.slice(0, 22)}…` : tip;
          return (
            <motion.li
              key={`${tip}-${i}`}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="relative flex gap-3 pl-1"
            >
              <span className="relative z-[1] mt-1.5 h-2 w-2 shrink-0 rounded-full border border-cyan-400/50 bg-slate-950 shadow-[0_0_10px_rgba(34,211,238,0.45)]" />
              <div className="min-w-0 flex-1 rounded-[12px] border border-white/[0.08] bg-white/[0.04] p-3 transition-colors hover:border-cyan-400/25 hover:bg-white/[0.06]">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-qdisplay text-[12px] font-medium leading-snug text-white/90">{title}</p>
                    <p className="mt-1 font-quantum text-[11px] leading-relaxed text-white/45">{tip}</p>
                  </div>
                  <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400/50" aria-hidden />
                </div>
              </div>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

export function QuantumRhythmBlock({
  expression,
  emotion,
}: {
  expression: number;
  emotion: number;
}) {
  return (
    <CyberMonitorSection delay={0.08} className="rounded-[18px] border border-fuchsia-500/20 bg-slate-950/40 p-4 backdrop-blur-xl">
      <p className="mb-4 font-qdisplay text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">节奏卡</p>
      <div className="flex justify-around gap-2">
        <RhythmRing label="表达结构" value={expression} accent="cyan" />
        <RhythmRing label="情绪稳定" value={emotion} accent="violet" />
      </div>
    </CyberMonitorSection>
  );
}
