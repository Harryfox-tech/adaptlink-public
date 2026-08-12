import { getStudentDashboard } from "@/lib/api/client";
import { ResumeInsightPanel } from "@/components/student/resume-insight-panel";
import { NeoCanvas } from "@/components/neo/neo-canvas";
import { GlassCard } from "@/components/neo/glass-card";
import { NeoWelcomeCard } from "@/components/neo/neo-welcome-card";
import { NeoAbilityRadar } from "@/components/neo/neo-ability-radar";
import { NeoItem, NeoStagger } from "@/components/neo/motion";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, Sparkles } from "lucide-react";

function clamp01(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function parseFirstNumber(value: string) {
  const parsed = Number.parseFloat(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default async function StudentDashboardPage() {
  const dashboard = await getStudentDashboard("stu_001");
  const tai = clamp01(parseFirstNumber(dashboard.metrics?.[0]?.value ?? "85.5"));

  const radarLeft = [
    { subject: "沟通", score: clamp01(parseFirstNumber(dashboard.metrics?.[0]?.value ?? "84.6")) },
    { subject: "逻辑", score: clamp01(parseFirstNumber(dashboard.metrics?.[2]?.value ?? "78")) },
    { subject: "岗位匹配", score: clamp01(parseFirstNumber(dashboard.metrics?.[2]?.value ?? "78")) },
    { subject: "技术", score: clamp01(parseFirstNumber(dashboard.metrics?.[1]?.value ?? "27") * 2.8) },
    { subject: "成长", score: clamp01(parseFirstNumber(dashboard.metrics?.[3]?.value ?? "4") * 18) },
  ];

  const radarRight = [
    { subject: "协作", score: clamp01(parseFirstNumber(dashboard.metrics?.[0]?.value ?? "84.6") - 6) },
    { subject: "表达", score: clamp01(parseFirstNumber(dashboard.metrics?.[0]?.value ?? "84.6") - 2) },
    { subject: "抗压", score: clamp01(parseFirstNumber(dashboard.metrics?.[2]?.value ?? "78") - 1) },
    { subject: "适应", score: clamp01(parseFirstNumber(dashboard.metrics?.[1]?.value ?? "27") * 2.4) },
    { subject: "岗位匹配", score: clamp01(parseFirstNumber(dashboard.metrics?.[2]?.value ?? "78")) },
  ];

  return (
    <NeoCanvas>
      <NeoStagger>
      <NeoItem className="mb-1">
        <header className="border-b border-white/10 pb-5">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">学生成长总览</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/55 md:text-base">基于模拟训练与档案数据的能力视图，帮助你规划下一步行动。</p>
        </header>
      </NeoItem>

      <div className="dashboard-grid">
        <div className="dashboard-main">
          <NeoItem>
            <NeoWelcomeCard role="student" />
          </NeoItem>

          <NeoItem>
            <GlassCard className="px-6 py-5 neo-hover-float">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[14px] font-semibold text-white">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                能力表现
              </div>
              <div className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-white/70">
                可视化
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_18px_rgba(34,211,238,0.10)]">
                <NeoAbilityRadar title="综合评估" data={radarLeft} />
              </div>
              <div className="rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_18px_rgba(34,211,238,0.10)]">
                <NeoAbilityRadar title="协作能力" data={radarRight} />
              </div>
            </div>

            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <div className="text-[12px] font-medium text-white/60">核心指标</div>
                <div className="mt-1 font-mono text-[2rem] font-semibold tabular-nums tracking-tight text-cyan-200">
                    TAI {tai.toFixed(1)}
                  </div>
                <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-1 text-[12px] text-white/60">
                  <div>
                    模拟训练次数{" "}
                    <span className="font-semibold tabular-nums text-white">{dashboard.metrics?.[1]?.value ?? "27"}</span>
                  </div>
                  <div>
                    岗位匹配中位分{" "}
                    <span className="font-semibold tabular-nums text-white">{dashboard.metrics?.[2]?.value ?? "78"}</span>
                  </div>
                  <div>
                    本周行动项{" "}
                    <span className="font-semibold tabular-nums text-white">{dashboard.metrics?.[3]?.value ?? "4"}</span>
                  </div>
                  <div>
                    变化趋势{" "}
                    <span className="font-semibold tabular-nums text-cyan-200">{dashboard.metrics?.[0]?.delta ?? "+3.4"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(dashboard.metrics ?? []).slice(0, 4).map((m) => (
                  <div
                    key={m.title}
                    className="rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 shadow-[0_0_18px_rgba(59,130,246,0.08)] transition hover:border-cyan-300/30 hover:bg-white/7"
                  >
                    <div className="text-[11px] font-semibold text-white/55">{m.title}</div>
                    <div className="mt-1 flex items-end justify-between gap-3">
                      <div className="text-[18px] font-semibold text-white">{m.value}</div>
                      <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70">
                        {m.delta}
                      </div>
                    </div>
                    <div className="mt-1 text-[10px] text-white/45">{m.hint}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
          </NeoItem>

          <div className="grid grid-cols-2 gap-5">
            <NeoItem>
              <GlassCard className="px-6 py-5 neo-hover-float">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-semibold text-white">AI 可执行报告</div>
                <div className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-white/70">
                  AI 交互
                </div>
              </div>
              <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-4 text-[12px] leading-[18px] text-white/65">
                <div className="text-[12px] font-semibold text-white/85">综合评估</div>
                <div className="mt-2 space-y-1">
                  {(dashboard.todaySuggestions ?? []).slice(0, 3).map((t, idx) => (
                    <div key={t} className="flex gap-2">
                      <div className="mt-[2px] h-4 w-4 rounded-full bg-cyan-500/15 text-center text-[11px] font-semibold text-cyan-300">
                        {idx + 1}
                      </div>
                      <div>{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-4">
                <div className="text-[12px] font-semibold text-white/85">风险提示</div>
                <div className="mt-2 text-[12px] leading-[18px] text-white/60">{dashboard.riskSummary}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[11px] font-semibold text-red-300">
                    高压沟通波动
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                    逻辑链条偶发断裂
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-md border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                    案例深度待增强
                  </span>
                </div>
              </div>
            </GlassCard>
            </NeoItem>

            <NeoItem>
              <GlassCard className="px-6 py-5 neo-hover-float">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-semibold text-white">下一步行动</div>
                <div className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-white/70">
                  今日
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {(dashboard.todaySuggestions ?? []).slice(0, 4).map((t, idx) => {
                  const done = idx === 0;
                  return (
                    <Link
                      key={t}
                      href={idx % 2 === 0 ? "/student/simulators/job" : "/student/simulators/growth"}
                      className="group flex items-start justify-between gap-3 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition hover:-translate-y-[1px] hover:border-cyan-300/30 hover:bg-white/7 hover:shadow-[0_0_24px_rgba(34,211,238,0.10)]"
                    >
                      <div className="flex items-start gap-3">
                        {done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-300" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 text-white/45" />
                        )}
                        <div>
                          <div className="text-[12px] font-semibold text-white/85">{t}</div>
                          <div className="mt-1 text-[10px] text-white/55">
                            {done ? "已完成（0/2）" : "进行中（0/2）"} · 预计 12-18 分钟
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="mt-1 h-4 w-4 text-white/40 transition group-hover:text-cyan-300" />
                    </Link>
                  );
                })}
              </div>
            </GlassCard>
            </NeoItem>
          </div>

          <NeoItem>
            <GlassCard className="px-5 py-4 neo-hover-float">
              <ResumeInsightPanel snapshot={dashboard.resumeSnapshot} embedded />
            </GlassCard>
          </NeoItem>
        </div>

        <div className="dashboard-aside">
          <NeoItem>
            <GlassCard className="px-6 py-5 neo-hover-float">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold text-white">今日行动路线图</div>
              <div className="rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-white/70">
                今日
              </div>
            </div>

            <div className="mt-4 space-y-4">
              {[
                { time: "10:00", title: "简历解析", meta: "上传简历并生成分析", href: "/student/applications", active: true },
                { time: "11:00", title: "岗位推荐", meta: "查看匹配岗位与评分", href: "/student/recommendations" },
                { time: "12:00", title: "成长模拟", meta: "记录训练轨迹与反馈", href: "/student/simulators/growth" },
                { time: "13:00", title: "求职模拟", meta: "面试/场景对话训练", href: "/student/simulators/job" },
              ].map((it, idx) => (
                <div key={it.time} className="flex gap-4">
                  <div className="w-[46px] pt-2 text-[11px] font-semibold text-white/55">{it.time}</div>
                  <div className="relative flex-1">
                    <div className="absolute left-[-18px] top-0 h-full w-[1px] bg-gradient-to-b from-white/0 via-cyan-300/20 to-white/0" />
                    <div className="absolute left-[-24px] top-[14px]">
                      {it.active ? (
                        <div className="relative">
                          <span className="absolute inset-0 h-3 w-3 animate-ping rounded-full bg-cyan-300/35" />
                          <span className="block h-3 w-3 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.65)]" />
                        </div>
                      ) : (
                        <span className="block h-3 w-3 rounded-full bg-white/20" />
                      )}
                    </div>

                    <Link
                      href={it.href}
                      className={[
                        "group block rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition",
                        "hover:-translate-y-[1px] hover:border-cyan-300/30 hover:bg-white/7 hover:shadow-[0_0_22px_rgba(34,211,238,0.10)]",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-[12px] font-semibold text-white/85">{it.title}</div>
                          <div className="mt-1 text-[10px] text-white/55">{it.meta}</div>
                        </div>
                        <ChevronRight className="mt-0.5 h-4 w-4 text-white/35 transition group-hover:text-cyan-300" />
                      </div>
                      {idx === 0 ? (
                        <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-500/10 px-3 py-1 text-[10px] font-semibold text-cyan-200">
                          进行中（0/2）
                        </div>
                      ) : null}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
          </NeoItem>

          <NeoItem>
            <GlassCard className="px-6 py-5 neo-hover-float">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold text-white">个性化岗位推荐</div>
              <Link href="/student/recommendations" className="text-[12px] font-semibold text-cyan-300 hover:text-cyan-200">
                查看全部
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {[
                {
                  title: "增长运营实习生",
                  reason: "匹配你的逻辑与岗位理解",
                  score: 49.8,
                },
                {
                  title: "产品运营专员",
                  reason: "匹配你的协作与沟通能力",
                  score: 35.0,
                },
                {
                  title: "数据运营助理",
                  reason: "契合技术适应与分析能力",
                  score: 44.0,
                },
              ].map((job) => (
                <Link
                  key={job.title}
                  href="/student/recommendations"
                  className="group flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 transition duration-200 hover:-translate-y-px hover:border-cyan-300/25 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/12 text-cyan-100 ring-1 ring-cyan-400/20">
                      <span className="text-xs font-bold">岗</span>
                    </div>
                    <div>
                      <div className="text-[12px] font-semibold text-white/85">{job.title}</div>
                      <div className="mt-1 text-[10px] text-white/55">{job.reason}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-base font-semibold tabular-nums text-cyan-200">{job.score.toFixed(1)}</div>
                    <div className="text-[10px] text-white/45">匹配分</div>
                  </div>
                </Link>
              ))}
            </div>
          </GlassCard>
          </NeoItem>

          <NeoItem>
            <GlassCard className="px-6 py-5 neo-hover-float">
            <div className="flex items-center justify-between">
              <div className="text-[14px] font-semibold text-white">常用入口</div>
              <Link href="/student/profile" className="text-[12px] font-semibold text-cyan-300 hover:text-cyan-200">
                全部
              </Link>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { name: "成长档案", subtitle: "画像与能力建议", href: "/student/profile" },
                { name: "模拟历史", subtitle: "复盘每次训练", href: "/student/simulators/history" },
                { name: "AI 助手", subtitle: "问答/指导/复盘", href: "/student/assistant" },
              ].map((it) => (
                <Link
                  key={it.name}
                  href={it.href}
                  className="group flex items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 transition hover:border-cyan-300/30 hover:bg-white/7"
                >
                  <div>
                    <div className="text-[12px] font-semibold text-white/85">{it.name}</div>
                    <div className="mt-1 text-[10px] text-white/55">{it.subtitle}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-white/35 transition group-hover:text-cyan-300" />
                </Link>
              ))}
            </div>
          </GlassCard>
          </NeoItem>
        </div>
      </div>
      </NeoStagger>
    </NeoCanvas>
  );
}
