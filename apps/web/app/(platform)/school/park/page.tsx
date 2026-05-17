"use client";

import { useState } from "react";
import { GlassCard } from "@/components/neo/glass-card";

const DEMO_STATS = {
  total_projects: 12,
  open_projects: 8,
  matched_projects: 3,
  closed_projects: 1,
  total_applications: 47,
  accepted_applications: 9,
  by_domain: [
    { domain: "人工智能", count: 4 },
    { domain: "新能源", count: 3 },
    { domain: "智能制造", count: 2 },
    { domain: "生物医药", count: 2 },
    { domain: "新材料", count: 1 },
  ],
  by_type: [
    { type: "成果供给", count: 7 },
    { type: "需求发布", count: 4 },
    { type: "合作机会", count: 1 },
  ],
};

export default function ParkOverviewPage() {
  const [s] = useState(DEMO_STATS);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2">
          <span className="text-2xl">🏛️</span>
          <span className="font-quantum text-xs text-white/35">政府 / 园区治理视角</span>
        </div>
        <h1 className="font-qdisplay text-3xl font-bold text-white/90">区域转化治理总览</h1>
        <p className="mt-1 font-quantum text-sm text-white/45">实时掌握区域科技成果转化整体态势</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: "项目总数", value: s.total_projects, icon: "📋", color: "from-cyan-600/15 to-blue-600/10" },
          { label: "正在对接", value: s.open_projects, icon: "🔄", color: "from-green-600/15 to-emerald-600/10" },
          { label: "已完成对接", value: s.matched_projects, icon: "✅", color: "from-blue-600/15 to-indigo-600/10" },
          { label: "总申请记录", value: s.total_applications, icon: "📩", color: "from-orange-600/15 to-red-600/10" },
        ].map((item) => (
          <GlassCard key={item.label} className={`bg-gradient-to-br p-5 ${item.color}`}>
            <div className="mb-2 text-3xl">{item.icon}</div>
            <div className="font-qdisplay text-3xl font-bold text-white/90">{item.value}</div>
            <div className="mt-1 font-quantum text-xs text-white/40">{item.label}</div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* By domain */}
        <GlassCard className="p-5">
          <h2 className="mb-4 font-qdisplay text-base font-semibold text-white/80">技术领域分布</h2>
          <div className="space-y-3">
            {s.by_domain.map((item) => {
              const pct = Math.round((item.count / s.total_projects) * 100);
              return (
                <div key={item.domain} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-quantum text-sm text-white/60">{item.domain}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right font-quantum text-sm text-white/40">{item.count}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* By type */}
        <GlassCard className="p-5">
          <h2 className="mb-4 font-qdisplay text-base font-semibold text-white/80">项目类型分布</h2>
          <div className="space-y-4">
            {s.by_type.map((item) => {
              const pct = Math.round((item.count / s.total_projects) * 100);
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <span className="w-20 shrink-0 font-quantum text-sm text-white/60">{item.type}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-500" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-right font-quantum text-sm text-white/40">{item.count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-white/5 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[12px] border border-white/8 bg-white/5 p-3 text-center">
                <p className="font-qdisplay text-2xl font-bold text-green-300">{s.accepted_applications}</p>
                <p className="font-quantum text-xs text-white/40">成功对接</p>
              </div>
              <div className="rounded-[12px] border border-white/8 bg-white/5 p-3 text-center">
                <p className="font-qdisplay text-2xl font-bold text-cyan-300">
                  {s.total_applications > 0 ? Math.round((s.accepted_applications / s.total_applications) * 100) : 0}%
                </p>
                <p className="font-quantum text-xs text-white/40">对接成功率</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Quick actions */}
      <GlassCard className="bg-gradient-to-r from-cyan-900/20 to-blue-900/15 p-5">
        <h2 className="mb-4 font-qdisplay text-base font-semibold text-white/80">快捷治理动作</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: "导出转化报告", icon: "📊", desc: "一键生成区域转化月报" },
            { label: "重点跟踪", icon: "⭐", desc: "标记需重点关注项目" },
            { label: "政策匹配", icon: "🏛️", desc: "智能匹配可用扶持政策" },
            { label: "预警提醒", icon: "🔔", desc: "长期未对接项目预警" },
          ].map((a) => (
            <button key={a.label} className="flex flex-col items-center gap-1.5 rounded-[14px] border border-white/8 bg-white/5 p-4 text-center transition-all hover:bg-white/10">
              <span className="text-2xl">{a.icon}</span>
              <span className="font-quantum text-xs text-white/80">{a.label}</span>
              <span className="font-quantum text-xs text-white/35">{a.desc}</span>
            </button>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
