import { getEnterpriseDashboardData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LmsCanvas } from "@/components/lms/lms-canvas";
import { WelcomeCard } from "@/components/lms/welcome-card";
import { CalendarCard } from "@/components/lms/calendar-card";
import { UpcomingEventsCard } from "@/components/lms/upcoming-events-card";
import { LmsSurface } from "@/components/lms/lms-surface";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterpriseDashboardPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterpriseDashboardData(token);

  return (
    <LmsCanvas title="Dashboard for enterprise">
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <WelcomeCard role="enterprise" imageSrc="/pic/new1.png" />
          <div className="grid grid-cols-2 gap-5">
            <LmsSurface>
              <div className="flex items-center justify-between">
                <div className="font-qdisplay text-[14px] font-semibold text-white/90">快捷入口</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <a href="/enterprise/jobs" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">岗位建模</a>
                <a href="/enterprise/talent-pool" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">候选人工作台</a>
                <a href="/enterprise/recruitment" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">流程协同</a>
                <a href="/enterprise/analytics" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">数据洞察</a>
              </div>
              <div className="mt-3 font-quantum text-xs text-white/45">直接跳转到端内核心工作台。</div>
            </LmsSurface>
            <LmsSurface>
              <div className="flex items-center justify-between">
                <div className="font-qdisplay text-[14px] font-semibold text-white/90">今日关注</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  漏斗首环节：{data.funnel?.[0]?.stage ?? "投递"} · {data.funnel?.[0]?.value ?? "-"}
                </p>
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  预警条数：{data.warnings?.length ?? 0}
                </p>
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  热词示例：{data.gap_words?.[0] ?? "—"}
                </p>
              </div>
            </LmsSurface>
          </div>

          <PageHero
            title="招聘经营总览"
            description="围绕岗位建模、候选人筛选、流程协同与校企合作形成闭环运营视图。"
            tags={["仪表盘", "TAI 分布", "能力缺口", "流程预警"]}
            metrics={data.metrics}
          />

          <Card>
            <CardHeader><CardTitle>招聘漏斗进展</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.funnel.map((item, idx) => (
                <div key={item.stage}>
                  <div className="mb-1 flex items-center justify-between font-quantum text-sm text-white/55"><span>{item.stage}</span><span className="tabular-nums text-white/70">{item.value}</span></div>
                  <div className="h-2 rounded-full bg-white/[0.08]"><div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" style={{ width: `${(item.value / data.funnel[0].value) * 100}%` }} /></div>
                  {idx < data.funnel.length - 1 ? <div className="my-1 border-t border-dashed border-white/10" /> : null}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>能力缺口热词</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {data.gap_words.map((word, index) => (
                <Badge
                  key={word}
                  className={
                    index < 2
                      ? "border border-cyan-500/25 bg-cyan-500/12 font-quantum text-cyan-100/90"
                      : "border border-white/10 bg-white/5 font-quantum text-white/70"
                  }
                >
                  {word}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 space-y-5">
          <CalendarCard
            title="运营日程"
            subtitle="快捷入口"
            rangeLabel="Today"
            items={[
              { time: "10:00", title: "岗位建模", meta: "创建/优化岗位画像", active: true, href: "/enterprise/jobs" },
              { time: "11:00", title: "候选人池", meta: "筛选与解释详情", href: "/enterprise/talent-pool" },
              { time: "12:00", title: "流程协同", meta: "面试回流与预警", href: "/enterprise/recruitment" },
              { time: "13:00", title: "数据洞察", meta: "报告与趋势", href: "/enterprise/analytics" },
            ]}
          />
          <UpcomingEventsCard
            title="重点提醒"
            actionLabel="去流程协同"
            actionHref="/enterprise/recruitment"
            events={[
              { title: data.warnings?.[0]?.message ?? "关注超时环节与 SLA 风险", meta: "预警", href: "/enterprise/recruitment" },
              { title: "检查候选人池可复用人才", meta: "建议", href: "/enterprise/talent-pool" },
            ]}
          />
          <LmsSurface className="px-5 py-4">
            <div className="font-qdisplay text-[14px] font-semibold text-white/90">今日预警</div>
            <div className="mt-4 space-y-2 text-sm">
              {data.warnings.map((item) => (
                <p key={item.message} className="rounded-[16px] border border-orange-500/20 bg-orange-500/10 px-3 py-2 font-quantum text-orange-100/80">
                  {item.message}
                </p>
              ))}
            </div>
          </LmsSurface>
        </div>
      </div>
    </LmsCanvas>
  );
}
