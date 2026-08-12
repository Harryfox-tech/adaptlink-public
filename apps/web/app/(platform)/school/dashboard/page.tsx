import { getSchoolDashboardData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LmsCanvas } from "@/components/lms/lms-canvas";
import { WelcomeCard } from "@/components/lms/welcome-card";
import { CalendarCard } from "@/components/lms/calendar-card";
import { UpcomingEventsCard } from "@/components/lms/upcoming-events-card";
import { LmsSurface } from "@/components/lms/lms-surface";

export default async function SchoolDashboardPage() {
  const data = await getSchoolDashboardData();

  return (
    <LmsCanvas title="高校培养诊断总览">
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-5">
          <WelcomeCard role="school" imageSrc="/pic/new1.png" />
          <div className="grid grid-cols-2 gap-5">
            <LmsSurface>
              <div className="flex items-center justify-between">
                <div className="font-qdisplay text-[14px] font-semibold text-white/90">快捷入口</div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <a href="/school/students" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">学生画像</a>
                <a href="/school/curriculum" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">专业与课程分析</a>
                <a href="/school/projects" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">项目招募中心</a>
                <a href="/school/analytics" className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/80 transition hover:border-cyan-400/20 hover:bg-white/[0.06]">决策报告中心</a>
              </div>
              <div className="mt-3 font-quantum text-xs text-white/45">一键进入端内核心模块。</div>
            </LmsSurface>
            <LmsSurface>
              <div className="flex items-center justify-between">
                <div className="font-qdisplay text-[14px] font-semibold text-white/90">重点提示</div>
              </div>
              <div className="mt-4 space-y-2 text-sm">
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  当前缺口专业：{data.major_gaps?.[0]?.major ?? "—"}
                </p>
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  主要缺口：{data.major_gaps?.[0]?.gap ?? "—"}
                </p>
                <p className="rounded-[16px] border border-white/10 bg-white/[0.04] px-4 py-3 font-quantum text-white/70">
                  风险等级：{data.major_gaps?.[0]?.level ?? "—"}
                </p>
              </div>
            </LmsSurface>
          </div>

          <PageHero title="培养诊断总览" description="聚焦培养供需差距、学生能力画像与校企合作反馈，形成教学改革闭环。" tags={["供需诊断", "课程贡献", "风险预警", "协同反馈"]} metrics={data.metrics} />

          <Card>
            <CardHeader><CardTitle>多层级视图切换</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-2 text-sm">
              <Badge className="border border-cyan-500/25 bg-cyan-500/12 font-quantum text-cyan-100/90">学校</Badge>
              <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">学院</Badge>
              <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">专业</Badge>
              <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">年级</Badge>
              <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">班级</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>重点专业能力缺口</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {data.major_gaps.map((item) => (
                <div key={item.major} className="quantum-glass-texture rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm text-white/65 backdrop-blur-md">
                  <p className="font-qdisplay font-medium text-white/90">{item.major}</p>
                  <p className="mt-1">主要缺口：{item.gap}</p>
                  <p className="mt-1">风险等级：{item.level}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1 space-y-5">
          <CalendarCard
            title="治理/教学日程"
            subtitle="快捷入口"
            rangeLabel="今日"
            items={[
              { time: "10:00", title: "学生画像", meta: "分层风险与干预", active: true, href: "/school/students" },
              { time: "11:00", title: "课程分析", meta: "能力映射与优化", href: "/school/curriculum" },
              { time: "12:00", title: "项目招募", meta: "发布与推送", href: "/school/projects" },
              { time: "13:00", title: "决策报告", meta: "导出与分发", href: "/school/analytics" },
            ]}
          />
          <UpcomingEventsCard
            title="重点提醒"
            actionLabel="去学生画像"
            actionHref="/school/students"
            events={[
              { title: data.major_gaps?.[0] ? `${data.major_gaps[0].major}：${data.major_gaps[0].gap}` : "关注重点专业能力缺口", meta: "缺口", href: "/school/dashboard" },
              { title: "检查高风险学生分层干预任务", meta: "建议", href: "/school/students" },
            ]}
          />
          <LmsSurface className="px-5 py-4">
            <div className="font-qdisplay text-[14px] font-semibold text-white/90">本周行动</div>
            <div className="mt-4 space-y-2 font-quantum text-sm text-white/60">
              <p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">发布 3 个企业实践项目</p>
              <p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">更新 2 门课程能力映射</p>
              <p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3">完成高风险学生分层干预</p>
            </div>
          </LmsSurface>
        </div>
      </div>
    </LmsCanvas>
  );
}
