"use client";

import Image from "next/image";
import * as React from "react";
import { motion } from "framer-motion";

const DEMO_LABELS = [
  { tag: "LEADER", score: "92" },
  { tag: "TECH", score: "88" },
  { tag: "OPS", score: "85" },
  { tag: "DATA", score: "90" },
  { tag: "UX", score: "87" },
  { tag: "PM", score: "84" },
  { tag: "DEV", score: "91" },
  { tag: "AI", score: "93" },
];

/** 顶部「赛博人才群像数据卡」：3.png + 毛玻璃 + 慢速几何粒子层 + 标签占位 */
export function QuantumTalentHeroPanel({ imageSrc = "/pic/3.png" }: { imageSrc?: string }) {
  return (
    <div className="relative min-h-[200px] overflow-hidden rounded-[22px] border border-cyan-500/20 bg-slate-950/60 shadow-[0_0_48px_rgba(34,211,238,0.14),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-lg">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(34, 211, 238, 0.12), transparent 55%), radial-gradient(ellipse 60% 50% at 80% 20%, rgba(168, 85, 247, 0.1), transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute -inset-[60%] animate-[quantum-mesh-spin_140s_linear_infinite] opacity-[0.22]">
        <div
          className="h-full w-full"
          style={{
            background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(34,211,238,0.15) 60deg, transparent 120deg, rgba(168,85,247,0.12) 200deg, transparent 280deg, rgba(34,211,238,0.1) 360deg)`,
          }}
        />
      </div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(168,85,247,0.04)_1px,transparent_1px)] [background-size:32px_32px] opacity-50" />

      <div className="relative z-[1] p-4 md:p-5">
        <p className="mb-3 font-qdisplay text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80">Holographic Talent Mesh</p>
        <div className="relative overflow-hidden rounded-[14px]">
          <Image
            src={imageSrc}
            alt="赛博人才群像数据卡"
            width={920}
            height={480}
            className="h-auto w-full object-contain object-center"
            priority
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-8">
          {DEMO_LABELS.map((row, i) => (
            <motion.div
              key={row.tag}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="rounded-lg border border-cyan-500/15 bg-black/30 px-1.5 py-2 text-center backdrop-blur-sm"
            >
              <p className="font-quantum text-[9px] uppercase tracking-wider text-cyan-200/70">{row.tag}</p>
              <p className="font-quantum text-[11px] tabular-nums text-white/90 shadow-[0_0_12px_rgba(34,211,238,0.25)]">
                <motion.span
                  key={row.score}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: [0.7, 1, 0.85] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.15 }}
                >
                  {row.score}
                </motion.span>
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
