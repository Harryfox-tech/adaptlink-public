"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { GlassCard } from "@/components/neo/glass-card";
import { Button } from "@/components/ui/button";
import { IpBlock } from "@/components/transformation/achievement/ip-block";
import { TrlBadge } from "@/components/transformation/achievement/trl-badge";
import { StageTracker } from "@/components/transformation/achievement/stage-tracker";
import type { ResearchAchievement } from "@/lib/types";

const DEMO_MAP: Record<string, ResearchAchievement> = {
  "ach-1": {
    id: "ach-1", creatorId: "school-1", creatorRole: "school",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    abstract: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利。本技术解决了传统钙钛矿电池制备工艺复杂、成本高昂的核心瓶颈，适用于分布式光伏、建筑一体化光伏等场景。",
    achievementType: "专利", domain: "新能源",
    keywords: ["钙钛矿", "太阳能电池", "印刷工艺", "低成本制备"],
    applicationScenario: "分布式光伏、建筑一体化光伏（BIPV）、便携式储能设备",
    ipStatus: "已授权", patentNumbers: ["CN202310001234.5", "CN202310005678.9", "CN202310009012.3"], patentType: "发明专利",
    publicationLink: "https://doi.org/10.1038/s41560-024-01234-5",
    trlLevel: 6, maturityDesc: "已完成工程样机验证，中试线建设中",
    cooperationMode: "技术转让", budgetRange: "50-200万", transformationStage: "negotiating",
    teamName: "新能源材料与器件研究团队", institutionName: "清华大学材料学院",
    contactName: "李明华 教授", contactEmail: "liminghua@university.edu.cn", contactPhone: "+86-138-0000-1234",
    requiredAbilities: ["材料科学", "光电化学", "工艺工程", "光伏系统集成"],
    status: "active", viewCount: 128, createdAt: "2026-03-15T08:00:00Z", updatedAt: "2026-03-15T08:00:00Z",
  },
};

type Tab = "overview" | "ip" | "path" | "abilities";

const TYPE_COLORS: Record<string, string> = {
  专利: "bg-cyan-500/15 border-cyan-400/20 text-cyan-200",
  软件著作权: "bg-blue-500/15 border-blue-400/20 text-blue-200",
  学术论文: "bg-purple-500/15 border-purple-400/20 text-purple-200",
  技术原型: "bg-orange-500/15 border-orange-400/20 text-orange-200",
  算法模型: "bg-fuchsia-500/15 border-fuchsia-400/20 text-fuchsia-200",
  工艺方法: "bg-green-500/15 border-green-400/20 text-green-200",
  设备装置: "bg-yellow-500/15 border-yellow-400/20 text-yellow-200",
};

export default function AchievementDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [achievement, setAchievement] = useState<ResearchAchievement | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [applyMsg, setApplyMsg] = useState("");
  const [applyStatus, setApplyStatus] = useState<"idle" | "loading" | "success">("idle");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/v1/achievements/${id}`);
        if (res.ok) {
          const data = await res.json();
          setAchievement(data.achievement);
          return;
        }
      } catch { /* fall through */ }
      // fallback
      setAchievement(DEMO_MAP[id] ?? Object.values(DEMO_MAP)[0]);
    };
    load();
  }, [id]);

  if (!achievement) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <span className="ml-3 font-quantum text-sm text-white/50">加载中...</span>
      </div>
    );
  }

  const typeColor = TYPE_COLORS[achievement.achievementType] ?? "bg-white/8 border-white/10 text-white/50";

  const handleApply = async () => {
    setApplyStatus("loading");
    await new Promise((r) => setTimeout(r, 800));
    setApplyStatus("success");
  };

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 font-quantum text-sm text-white/45 transition-colors hover:text-white/70"
      >
        ← 返回成果库
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-5 lg:col-span-2">
          {/* Title block */}
          <GlassCard className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-3 py-1 font-quantum text-xs ${typeColor}`}>
                {achievement.achievementType}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-quantum text-xs text-white/50">
                🎓 {achievement.institutionName}
              </span>
              {achievement.trlLevel != null && (
                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 font-quantum text-xs text-cyan-200">
                  TRL {achievement.trlLevel}
                </span>
              )}
            </div>
            <h1 className="mb-3 font-qdisplay text-2xl font-bold leading-snug text-white/95 md:text-3xl">
              {achievement.title}
            </h1>
            <div className="flex flex-wrap gap-4 font-quantum text-xs text-white/40">
              <span>📂 {achievement.domain}</span>
              <span>🤝 {achievement.cooperationMode}</span>
              {achievement.budgetRange && <span>💰 {achievement.budgetRange}</span>}
              {achievement.teamName && <span>👥 {achievement.teamName}</span>}
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
            {(["overview", "ip", "path", "abilities"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-[10px] px-3 py-2 font-quantum text-sm transition-all ${
                  activeTab === tab ? "bg-cyan-500/15 text-cyan-200" : "text-white/45 hover:text-white/70"
                }`}
              >
                {tab === "overview" ? "成果概述" : tab === "ip" ? "知识产权" : tab === "path" ? "转化路径" : "能力要求"}
              </button>
            ))}
          </div>

          {/* Tab: overview */}
          {activeTab === "overview" && (
            <GlassCard className="p-6">
              <h3 className="mb-4 font-qdisplay text-lg font-semibold text-white/90">成果摘要</h3>
              <p className="whitespace-pre-wrap font-quantum text-sm leading-relaxed text-white/65">
                {achievement.abstract}
              </p>
              {achievement.applicationScenario && (
                <div className="mt-5 rounded-[12px] border border-cyan-400/10 bg-cyan-500/5 p-4">
                  <p className="mb-1 font-quantum text-xs text-cyan-300/60">应用场景</p>
                  <p className="font-quantum text-sm text-white/70">{achievement.applicationScenario}</p>
                </div>
              )}
              {achievement.keywords.length > 0 && (
                <div className="mt-5">
                  <p className="mb-2 font-quantum text-xs text-white/40">关键词</p>
                  <div className="flex flex-wrap gap-2">
                    {achievement.keywords.map((k) => (
                      <span key={k} className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-1 font-quantum text-sm text-white/60">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-5">
                {[
                  { label: "成果类型", value: achievement.achievementType },
                  { label: "技术领域", value: achievement.domain },
                  { label: "合作模式", value: achievement.cooperationMode },
                  { label: "发布时间", value: new Date(achievement.createdAt).toLocaleDateString("zh-CN") },
                ].map((item) => (
                  <div key={item.label} className="rounded-[12px] border border-white/8 bg-white/5 p-3">
                    <p className="font-quantum text-xs text-white/40">{item.label}</p>
                    <p className="mt-1 font-qdisplay text-base font-semibold text-white/80">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {/* Tab: ip */}
          {activeTab === "ip" && (
            <GlassCard className="p-6">
              <h3 className="mb-5 font-qdisplay text-lg font-semibold text-white/90">知识产权信息</h3>
              <IpBlock achievement={achievement} />
            </GlassCard>
          )}

          {/* Tab: path */}
          {activeTab === "path" && (
            <GlassCard className="bg-gradient-to-br from-fuchsia-900/15 to-purple-900/15 p-6">
              <h3 className="mb-5 font-qdisplay text-lg font-semibold text-white/90">转化路径</h3>
              <div className="mb-6">
                <TrlBadge trlLevel={achievement.trlLevel} maturityDesc={achievement.maturityDesc} />
              </div>
              <div className="border-t border-white/5 pt-5">
                <p className="mb-4 font-quantum text-xs text-white/40">当前转化阶段</p>
                <StageTracker currentStage={achievement.transformationStage} />
              </div>
              {/* TAI/LSM placeholder */}
              <div className="mt-6 rounded-[12px] border border-fuchsia-400/15 bg-fuchsia-500/5 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔬</span>
                  <div>
                    <p className="font-qdisplay text-sm font-semibold text-fuchsia-200/80">TAI × LSM 路径仿真</p>
                    <p className="font-quantum text-xs text-white/40">基于 TAI 能力评估与 LSM 仿真引擎，生成个性化转化路径建议（登录后可用）</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Tab: abilities */}
          {activeTab === "abilities" && (
            <GlassCard className="p-6">
              <h3 className="mb-4 font-qdisplay text-lg font-semibold text-white/90">所需能力维度</h3>
              {achievement.requiredAbilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {achievement.requiredAbilities.map((a) => (
                    <span key={a} className="rounded-[10px] border border-cyan-400/15 bg-cyan-500/10 px-3 py-1.5 font-quantum text-sm text-cyan-200">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-quantum text-sm text-white/40">暂无能力要求信息</p>
              )}
              <p className="mt-4 font-quantum text-xs text-white/35">
                * 以上能力标签与平台 TAI 能力评估体系对齐，系统将基于能力匹配度推荐合作候选方。
              </p>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Apply */}
          <GlassCard className="p-5">
            <h3 className="mb-4 font-qdisplay text-base font-semibold text-white/90">申请对接</h3>
            {applyStatus === "success" ? (
              <div className="rounded-[12px] border border-green-400/15 bg-green-500/10 p-3">
                <p className="font-quantum text-sm text-green-200">✅ 申请已提交，等待对方确认</p>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={applyMsg}
                  onChange={(e) => setApplyMsg(e.target.value)}
                  placeholder="简要说明您的合作意向、企业背景或可提供的资源..."
                  className="min-h-[90px] w-full resize-none rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 font-quantum text-sm text-white/80 placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                />
                <Button onClick={() => void handleApply()} disabled={applyStatus === "loading"} className="w-full">
                  {applyStatus === "loading" ? "提交中..." : "申请对接"}
                </Button>
                <a href="/login">
                  <p className="text-center font-quantum text-xs text-white/30 hover:text-cyan-400/50">
                    登录后申请可获得完整对接服务
                  </p>
                </a>
              </div>
            )}
          </GlassCard>

          {/* Stage */}
          <GlassCard className="p-5">
            <h3 className="mb-4 font-qdisplay text-base font-semibold text-white/90">转化进度</h3>
            <StageTracker currentStage={achievement.transformationStage} />
          </GlassCard>

          {/* Contact */}
          <GlassCard className="p-5">
            <h3 className="mb-4 font-qdisplay text-base font-semibold text-white/90">联系方式</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <div>
                  <p className="font-quantum text-xs text-white/40">联系人</p>
                  <p className="font-quantum text-sm text-white/80">{achievement.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✉️</span>
                <div>
                  <p className="font-quantum text-xs text-white/40">邮箱</p>
                  <a href={`mailto:${achievement.contactEmail}`} className="font-quantum text-sm text-cyan-300/80 hover:text-cyan-300">
                    {achievement.contactEmail}
                  </a>
                </div>
              </div>
              {achievement.contactPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <div>
                    <p className="font-quantum text-xs text-white/40">电话</p>
                    <a href={`tel:${achievement.contactPhone}`} className="font-quantum text-sm text-cyan-300/80 hover:text-cyan-300">
                      {achievement.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
