import { getEnterpriseRecruitmentData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { EnterpriseRecruitmentWorkbench } from "@/components/enterprise/recruitment-workbench";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterpriseRecruitmentPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterpriseRecruitmentData(token);

  return (
    <div className="space-y-4">
      <PageHero title="流程协同与评估回流" description="在筛选、面试、评分、录用复盘中形成统一标准，支持结构化面试题与能力项回流。" tags={["结构化面试", "评分回流", "SLA", "复盘闭环"]} />
      <EnterpriseRecruitmentWorkbench initialData={data} />
    </div>
  );
}
