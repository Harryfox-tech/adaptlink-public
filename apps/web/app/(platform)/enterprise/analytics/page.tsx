import { getEnterpriseAnalyticsData } from "@/lib/api/client";
import { EnterpriseAnalyticsWorkbench } from "@/components/enterprise/analytics-workbench";
import { PageHero } from "@/components/dashboard/page-hero";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterpriseAnalyticsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterpriseAnalyticsData(token);

  return (
    <div className="space-y-4">
      <PageHero title="人才供给洞察中心" description="按岗位、渠道、院校与能力缺口联动分析，定位招聘瓶颈并输出可执行经营策略。" tags={["渠道质量", "院校热力", "能力缺口", "供给结构", "策略建议"]} />
      <EnterpriseAnalyticsWorkbench initialData={data} />
    </div>
  );
}
