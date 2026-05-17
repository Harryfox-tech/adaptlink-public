"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/neo/glass-card";
import type { TransformationProject } from "@/lib/types";

// Demo project for when API is unavailable
const DEMO_DETAIL = {
  project: {
    id: "demo-1",
    creatorId: "school-1",
    creatorRole: "school",
    projectType: "achievement_push",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    description: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利，具有良好的产业化前景。本技术解决了传统钙钛矿电池制备工艺复杂、成本高昂的核心瓶颈，适用于分布式光伏、建筑一体化光伏等场景。",
    domain: "新能源",
    maturityLevel: "工程样机",
    budgetRange: null,
    cooperationMode: "技术转让",
    requiredAbilities: ["材料科学", "光电化学", "工艺工程", "光伏系统集成"],
    status: "open",
    contactName: "李明华 教授",
    contactEmail: "liminghua@university.edu.cn",
    contactPhone: "+86-138-0000-1234",
    createdAt: "2026-03-15T08:00:00Z",
    updatedAt: "2026-03-15T08:00:00Z",
  },
  application_count: 3,
  accepted_count: 1,
};

const TYPE_LABELS: Record<string, string> = {
  achievement_push: "成果供给",
  demand_pull: "需求发布",
  collaborative: "合作机会",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "对接中", color: "bg-green-500/15 border-green-400/20 text-green-200" },
  matched: { label: "已对接", color: "bg-blue-500/15 border-blue-400/20 text-blue-200" },
  closed: { label: "已关闭", color: "bg-white/8 border-white/10 text-white/40" },
};

type Tab = "overview" | "abilities" | "path";

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [project, setProject] = useState<TransformationProject | null>(null);
  const [appCount, setAppCount] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [applyMessage, setApplyMessage] = useState("");
  const [applyStatus, setApplyStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [existingApp, setExistingApp] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/v1/transformation/projects/${id}`);
        if (res.ok) {
          const data = await res.json();
          setProject(data.project);
          setAppCount(data.application_count);
          setAcceptedCount(data.accepted_count);
        }
      } catch {
        if (id.startsWith("demo-")) {
          setProject(DEMO_DETAIL.project as TransformationProject);
          setAppCount(DEMO_DETAIL.application_count);
          setAcceptedCount(DEMO_DETAIL.accepted_count);
        }
      }
    };
    fetchData();
  }, [id]);

  const handleApply = async () => {
    if (!project) return;
    setApplyStatus("loading");
    try {
      const res = await fetch("/api/v1/transformation/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          applicantId: "guest-user",
          applicantRole: "student",
          message: applyMessage || null,
          abilities: [],
        }),
      });
      if (res.ok) {
        setApplyStatus("success");
        setExistingApp("pending");
      } else {
        setApplyStatus("error");
      }
    } catch {
      setApplyStatus("error");
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
        <span className="ml-3 font-quantum text-sm text-white/50">加载中...</span>
      </div>
    );
  }

  const typeLabel = TYPE_LABELS[project.projectType] ?? project.projectType;
  const status = STATUS_LABELS[project.status] ?? STATUS_LABELS["open"];
  const isOwner = false; // Would be determined by auth context

  return (
    <div className="space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 font-quantum text-sm text-white/45 transition-colors hover:text-white/70"
      >
        ← 返回
      </button>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Title block */}
          <GlassCard className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 p-6">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 font-quantum text-xs text-cyan-200">
                {typeLabel}
              </span>
              <span className={`rounded-full border px-3 py-1 font-quantum text-xs ${status.color}`}>
                {status.label}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-quantum text-xs text-white/50">
                {project.creatorRole === "school" ? "🎓 高校" : "🏢 企业"}
              </span>
            </div>
            <h1 className="mb-3 font-qdisplay text-2xl font-bold leading-snug text-white/95 md:text-3xl">
              {project.title}
            </h1>
            <div className="flex flex-wrap gap-4 font-quantum text-xs text-white/40">
              {project.domain && <span>📂 {project.domain}</span>}
              {project.maturityLevel && <span>🎯 成熟度：{project.maturityLevel}</span>}
              {project.cooperationMode && <span>🤝 {project.cooperationMode}</span>}
              {project.budgetRange && <span>💰 {project.budgetRange}</span>}
            </div>
          </GlassCard>

          {/* Tabs */}
          <div className="flex gap-1 rounded-[14px] border border-white/10 bg-white/[0.04] p-1 backdrop-blur-md">
            {(["overview", "abilities", "path"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-[10px] px-4 py-2 font-quantum text-sm transition-all ${
                  activeTab === tab
                    ? "bg-cyan-500/15 text-cyan-200"
                    : "text-white/45 hover:text-white/70"
                }`}
              >
                {tab === "overview" ? "项目详情" : tab === "abilities" ? "能力要求" : "转化路径"}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {activeTab === "overview" && (
            <GlassCard className="p-6">
              <h3 className="mb-4 font-qdisplay text-lg font-semibold text-white/90">项目概述</h3>
              <p className="whitespace-pre-wrap font-quantum text-sm leading-relaxed text-white/60">
                {project.description}
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-5">
                {[
                  { label: "申请数", value: appCount },
                  { label: "已对接", value: acceptedCount },
                  { label: "发布时间", value: new Date(project.createdAt).toLocaleDateString("zh-CN") },
                  { label: "合作模式", value: project.cooperationMode ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-[12px] border border-white/8 bg-white/5 p-3">
                    <p className="font-quantum text-xs text-white/40">{item.label}</p>
                    <p className="mt-1 font-qdisplay text-base font-semibold text-white/80">{item.value}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          {activeTab === "abilities" && (
            <GlassCard className="p-6">
              <h3 className="mb-4 font-qdisplay text-lg font-semibold text-white/90">所需能力维度</h3>
              {project.requiredAbilities.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {project.requiredAbilities.map((a) => (
                    <span key={a} className="rounded-[10px] border border-cyan-400/15 bg-cyan-500/10 px-3 py-1.5 font-quantum text-sm text-cyan-200">
                      {a}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-quantum text-sm text-white/40">暂无能力要求信息</p>
              )}
              <p className="mt-4 font-quantum text-xs text-white/35">
                * 以上能力标签与平台 TAI 能力评估体系对齐，系统将基于能力匹配度推荐合作候选人。
              </p>
            </GlassCard>
          )}

          {activeTab === "path" && (
            <GlassCard className="bg-gradient-to-br from-fuchsia-900/15 to-purple-900/15 p-6">
              <h3 className="mb-4 font-qdisplay text-lg font-semibold text-white/90">推荐转化路径（TAI 仿真）</h3>
              <div className="space-y-3">
                {[
                  { step: "第一步", title: "技术尽调", desc: "对接企业技术委员会，完成技术成熟度第三方评估，形成估值报告（预计 4–6 周）", done: true },
                  { step: "第二步", title: "商务谈判", desc: "依据估值报告协商转让/许可/作价入股方案，签订技术转让协议（预计 2–4 周）", done: false },
                  { step: "第三步", title: "中试验证", desc: "在企业侧完成中试放大，验证工艺可量产性（预计 3–6 个月）", done: false },
                  { step: "第四步", title: "规模化投产", desc: "完成产线建设，实现商业化规模生产（预计 6–12 个月）", done: false },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3 rounded-[12px] border border-white/8 bg-white/5 p-3">
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      item.done ? "bg-green-500/20 text-green-300" : "border border-white/15 bg-white/5 text-white/30"
                    }`}>
                      {item.done ? "✓" : "·"}
                    </div>
                    <div>
                      <p className="font-quantum text-xs text-white/40">{item.step}</p>
                      <p className="font-qdisplay text-sm font-semibold text-white/80">{item.title}</p>
                      <p className="mt-0.5 font-quantum text-xs text-white/45">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Apply card */}
          <GlassCard className="p-5">
            <h3 className="mb-4 font-qdisplay text-base font-semibold text-white/90">
              {project.projectType === "demand_pull" ? "申请参与" : "申请对接"}
            </h3>

            {existingApp ? (
              <div className="space-y-3">
                <div className="rounded-[12px] border border-yellow-400/15 bg-yellow-500/10 p-3">
                  <p className="font-quantum text-sm text-yellow-200">
                    {existingApp === "pending" ? "⏳ 申请已提交，等待对方确认" : existingApp === "accepted" ? "✅ 已对接成功" : "❌ 申请已被拒绝"}
                  </p>
                </div>
                <a href="mailto:liminghua@university.edu.cn">
                  <Button className="w-full">发送邮件联系</Button>
                </a>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 font-quantum text-xs text-white/45">申请说明（选填）</p>
                  <textarea
                    value={applyMessage}
                    onChange={(e) => setApplyMessage(e.target.value)}
                    placeholder="简要说明您的合作意向、团队优势或可提供的资源..."
                    className="min-h-[100px] w-full resize-none rounded-[12px] border border-white/10 bg-white/5 px-4 py-3 font-quantum text-sm text-white/80 placeholder:text-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
                  />
                </div>
                <Button
                  onClick={() => void handleApply()}
                  disabled={applyStatus === "loading"}
                  className="w-full"
                >
                  {applyStatus === "loading" ? "提交中..." : "提交申请"}
                </Button>
                <a href="/login">
                  <p className="text-center font-quantum text-xs text-white/30 hover:text-cyan-400/50">
                    登录后申请可获得完整对接服务
                  </p>
                </a>
              </div>
            )}
          </GlassCard>

          {/* Contact card */}
          <GlassCard className="p-5">
            <h3 className="mb-4 font-qdisplay text-base font-semibold text-white/90">联系方式</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">👤</span>
                <div>
                  <p className="font-quantum text-xs text-white/40">联系人</p>
                  <p className="font-quantum text-sm text-white/80">{project.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">✉️</span>
                <div>
                  <p className="font-quantum text-xs text-white/40">邮箱</p>
                  <a href={`mailto:${project.contactEmail}`} className="font-quantum text-sm text-cyan-300/80 hover:text-cyan-300">
                    {project.contactEmail}
                  </a>
                </div>
              </div>
              {project.contactPhone && (
                <div className="flex items-center gap-2">
                  <span className="text-lg">📞</span>
                  <div>
                    <p className="font-quantum text-xs text-white/40">电话</p>
                    <a href={`tel:${project.contactPhone}`} className="font-quantum text-sm text-cyan-300/80 hover:text-cyan-300">
                      {project.contactPhone}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </GlassCard>

          {/* Share */}
          <GlassCard className="p-5">
            <h3 className="mb-3 font-qdisplay text-base font-semibold text-white/90">分享项目</h3>
            <div className="flex gap-2">
              <a href={`mailto:?subject=${encodeURIComponent(project.title)}&body=${encodeURIComponent(`推荐项目：${project.title}\n\n${project.description}\n\n链接：${typeof window !== "undefined" ? window.location.href : ""}`)}`}>
                <Button variant="outline" size="sm">📧 邮件</Button>
              </a>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
