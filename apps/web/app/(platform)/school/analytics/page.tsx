import { getSchoolAnalyticsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { SchoolAnalyticsWorkbench } from "@/components/school/analytics-workbench";

export default async function SchoolAnalyticsPage() {
  const data = await getSchoolAnalyticsData();

  return (
    <div className="space-y-4">
      <PageHero title="决策报告中心" description="按校级、院级、专业级模板生成报告，支持参数化导出与会议汇报结构化输出。" tags={["报告模板", "参数化导出", "改革决策", "汇报包"]} />
      <SchoolAnalyticsWorkbench initialRows={data.report_rows} />
    </div>
  );
}
