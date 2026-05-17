"use client";

import type { EnterpriseDemand } from "@/lib/types";

const MODE_COLORS: Record<string, string> = {
  联合开发: "bg-blue-500/15 border-blue-400/20 text-blue-200",
  技术入股: "bg-purple-500/15 border-purple-400/20 text-purple-200",
  技术转让: "bg-cyan-500/15 border-cyan-400/20 text-cyan-200",
  许可生产: "bg-green-500/15 border-green-400/20 text-green-200",
};

const URGENCY_COLORS: Record<string, string> = {
  短期: "bg-red-500/15 border-red-400/30 text-red-200",
  中期: "bg-orange-500/15 border-orange-400/20 text-orange-200",
  长期: "bg-yellow-500/15 border-yellow-400/20 text-yellow-200",
};

interface Props {
  demand: EnterpriseDemand;
  onClick?: () => void;
}

export function DemandCard({ demand: d, onClick }: Props) {
  const modeColor = MODE_COLORS[d.cooperationMode] ?? "bg-white/8 border-white/10 text-white/50";
  const urgencyColor = URGENCY_COLORS[d.urgencyLevel] ?? "bg-white/8 border-white/10 text-white/50";

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all duration-200 hover:-translate-y-1 hover:border-orange-400/25 hover:bg-white/[0.07] hover:shadow-[0_24px_55px_rgba(249,115,22,0.12)]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-orange-600/20 to-red-600/20 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${modeColor}`}>
              {d.cooperationMode}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${urgencyColor}`}>
              {d.urgencyLevel}
            </span>
          </div>
          {d.enterpriseScale && (
            <span className="font-quantum text-xs text-white/35">{d.enterpriseScale}</span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="mb-2 line-clamp-2 font-qdisplay text-lg font-semibold leading-snug text-white/90 group-hover:text-white">
          {d.title}
        </h3>
        <p className="mb-3 line-clamp-2 font-quantum text-sm text-white/55">{d.description}</p>

        {/* Domain + enterprise */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-orange-400/15 bg-orange-500/8 px-2.5 py-1 font-quantum text-xs text-orange-200/80">
            {d.domain}
          </span>
          <span className="font-quantum text-xs text-white/35">🏢 {d.enterpriseName}</span>
        </div>

        {/* Budget + target TRL */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          {d.budgetRange && (
            <div className="rounded-[10px] border border-white/8 bg-white/5 px-3 py-2">
              <p className="font-quantum text-xs text-white/40">预算区间</p>
              <p className="font-qdisplay text-sm font-semibold text-orange-300">{d.budgetRange}</p>
            </div>
          )}
          {d.targetTrl != null && (
            <div className="rounded-[10px] border border-white/8 bg-white/5 px-3 py-2">
              <p className="font-quantum text-xs text-white/40">期望成熟度</p>
              <p className="font-qdisplay text-sm font-semibold text-cyan-300">TRL {d.targetTrl}</p>
            </div>
          )}
        </div>

        {/* Required abilities */}
        {d.requiredAbilities.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {d.requiredAbilities.slice(0, 4).map((a) => (
              <span key={a} className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/45">
                {a}
              </span>
            ))}
            {d.requiredAbilities.length > 4 && (
              <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/30">
                +{d.requiredAbilities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Verification tasks */}
        {d.verificationTasks.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 font-quantum text-xs text-white/35">可参与验证任务</p>
            <div className="flex flex-wrap gap-1">
              {d.verificationTasks.slice(0, 2).map((t) => (
                <span key={t} className="rounded-[8px] border border-green-400/15 bg-green-500/8 px-2 py-0.5 font-quantum text-xs text-green-200/70">
                  {t}
                </span>
              ))}
              {d.verificationTasks.length > 2 && (
                <span className="rounded-[8px] border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/30">
                  +{d.verificationTasks.length - 2}项
                </span>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="font-quantum text-xs text-white/30">
            💬 {d.matchCount} 个匹配成果
          </span>
          <span className="font-quantum text-xs text-orange-400/60 transition-colors group-hover:text-orange-300">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
}
