"use client";

import type { ResearchAchievement } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  专利: "bg-cyan-500/15 border-cyan-400/20 text-cyan-200",
  软件著作权: "bg-blue-500/15 border-blue-400/20 text-blue-200",
  学术论文: "bg-purple-500/15 border-purple-400/20 text-purple-200",
  技术原型: "bg-orange-500/15 border-orange-400/20 text-orange-200",
  算法模型: "bg-fuchsia-500/15 border-fuchsia-400/20 text-fuchsia-200",
  工艺方法: "bg-green-500/15 border-green-400/20 text-green-200",
  设备装置: "bg-yellow-500/15 border-yellow-400/20 text-yellow-200",
};

const IP_COLORS: Record<string, string> = {
  已授权: "bg-green-500/15 border-green-400/20 text-green-200",
  申请中: "bg-yellow-500/15 border-yellow-400/20 text-yellow-200",
  软件著作权: "bg-blue-500/15 border-blue-400/20 text-blue-200",
  开源: "bg-purple-500/15 border-purple-400/20 text-purple-200",
  无专利: "bg-white/8 border-white/10 text-white/40",
};

const STAGE_LABELS: Record<string, string> = {
  published: "发布中",
  negotiating: "洽谈中",
  contracted: "已签约",
  deployed: "落地中",
  completed: "已完成",
};

interface Props {
  achievement: ResearchAchievement;
  onClick?: () => void;
}

export function AchievementCard({ achievement: a, onClick }: Props) {
  const typeColor = TYPE_COLORS[a.achievementType] ?? "bg-white/8 border-white/10 text-white/50";
  const ipColor = IP_COLORS[a.ipStatus] ?? IP_COLORS["无专利"];
  const stageLabel = STAGE_LABELS[a.transformationStage] ?? a.transformationStage;
  const trl = a.trlLevel;

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.07] hover:shadow-[0_24px_55px_rgba(0,0,0,0.45)]"
      onClick={onClick}
    >
      {/* Header */}
      <div className="border-b border-white/5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${typeColor}`}>
              {a.achievementType}
            </span>
            <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${ipColor}`}>
              {a.ipStatus}
            </span>
          </div>
          <span className="font-quantum text-xs text-white/35">{stageLabel}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-5">
        <h3 className="mb-2 line-clamp-2 font-qdisplay text-lg font-semibold leading-snug text-white/90 group-hover:text-white">
          {a.title}
        </h3>
        <p className="mb-3 line-clamp-2 font-quantum text-sm text-white/55">{a.abstract}</p>

        {/* Institution + domain */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/15 bg-cyan-500/8 px-2.5 py-1 font-quantum text-xs text-cyan-200/80">
            {a.domain}
          </span>
          {a.institutionName && (
            <span className="font-quantum text-xs text-white/35">{a.institutionName}</span>
          )}
        </div>

        {/* TRL bar */}
        {trl != null && (
          <div className="mb-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-quantum text-xs text-white/40">技术成熟度 TRL</span>
              <span className="font-quantum text-xs font-semibold text-cyan-300/80">TRL {trl}</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all"
                style={{ width: `${(trl / 9) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Keywords */}
        {a.keywords.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {a.keywords.slice(0, 4).map((k) => (
              <span key={k} className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/45">
                {k}
              </span>
            ))}
            {a.keywords.length > 4 && (
              <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/30">
                +{a.keywords.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <span className="font-quantum text-xs text-white/30">
            {a.cooperationMode} · 👁 {a.viewCount}
          </span>
          <span className="font-quantum text-xs text-cyan-400/60 transition-colors group-hover:text-cyan-300">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
}
