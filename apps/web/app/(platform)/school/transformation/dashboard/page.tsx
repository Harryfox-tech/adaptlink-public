"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/neo/glass-card";
import type { TransformationProject, TransformationDashboardData } from "@/lib/types";

const DEMO_METRICS = [
  { title: "已发布成果", value: "3", delta: "+1", hint: "本月新增" },
  { title: "收到申请", value: "7", delta: "+3", hint: "本周新增" },
  { title: "已对接成功", value: "2", delta: "", hint: "本季度" },
  { title: "总浏览量", value: "284", delta: "+42", hint: "本周" },
];

const DEMO_PROJECTS: TransformationProject[] = [
  {
    id: "demo-1",
    creatorId: "school-user",
    creatorRole: "school",
    projectType: "achievement_push",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    description: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%",
    domain: "新能源",
    maturityLevel: "工程样机",
    budgetRange: null,
    cooperationMode: "技术转让",
    requiredAbilities: ["材料科学", "光电化学", "工艺工程"],
    status: "open",
    contactName: "李明华 教授",
    contactEmail: "liminghua@university.edu.cn",
    contactPhone: null,
    createdAt: "2026-03-15T08:00:00Z",
    updatedAt: "2026-03-15T08:00:00Z",
  },
];

export default function SchoolTransformationDashboard() {
  const router = useRouter();
  const [metrics, setMetrics] = useState(DEMO_METRICS);
  const [projects, setProjects] = useState<TransformationProject[]>(DEMO_PROJECTS);
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-qdisplay text-3xl font-bold text-white/90">科技成果转化中心</h1>
            <p className="mt-1 font-quantum text-sm text-white/45">管理已发布的成果，对接企业合作需求</p>
          </div>
          <div className="flex gap-3">
            <a href="/school/park">
              <button className="rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 font-quantum text-sm text-white/70 transition-all hover:bg-white/10">
                🏛️ 园区治理视图
              </button>
            </a>
            <a href="/school/transformation/publish">
              <button className="rounded-[12px] border border-cyan-300/15 bg-cyan-500/20 px-4 py-2 font-quantum text-sm text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.12)] transition-all hover:bg-cyan-500/30">
                + 发布新成果
              </button>
            </a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => (
          <GlassCard key={m.title} className="p-4">
            <p className="font-quantum text-xs text-white/40">{m.title}</p>
            <p className="mt-1 font-qdisplay text-2xl font-bold text-white/90">{m.value}</p>
            <p className="mt-0.5 font-quantum text-xs text-white/35">{m.delta} {m.hint}</p>
          </GlassCard>
        ))}
      </div>

      {/* Projects */}
      <div>
        <h2 className="mb-4 font-qdisplay text-lg font-semibold text-white/80">已发布的成果</h2>
        <div className="space-y-4">
          {projects.map((p) => (
            <GlassCard key={p.id} className="flex items-start justify-between p-5">
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${
                    p.status === "open" ? "border-green-400/20 bg-green-500/10 text-green-200" : "border-white/10 text-white/40"
                  }`}>
                    {p.status === "open" ? "🔄 对接中" : "✅ 已对接"}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-quantum text-xs text-white/50">
                    🎓 {p.creatorRole === "school" ? "高校" : p.creatorRole}
                  </span>
                </div>
                <h3 className="mb-1 font-qdisplay text-base font-semibold text-white/90">{p.title}</h3>
                <p className="font-quantum text-sm text-white/50">{p.domain} · {p.maturityLevel} · {p.cooperationMode}</p>
              </div>
              <div className="flex flex-col gap-2">
                <button onClick={() => router.push(`/transformation/projects/${p.id}`)} className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-1.5 font-quantum text-xs text-white/70 transition-all hover:bg-white/10">
                  查看详情
                </button>
                <button className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-1.5 font-quantum text-xs text-white/70 transition-all hover:bg-white/10">
                  管理申请
                </button>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </div>
  );
}
