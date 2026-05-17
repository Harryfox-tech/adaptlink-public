import { getEnterpriseJobsCenterData } from "@/lib/api/client";
import { EnterpriseJobsCenterWorkbench } from "@/components/enterprise/jobs-center-workbench";
import { PageHero } from "@/components/dashboard/page-hero";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterpriseJobsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterpriseJobsCenterData(token);

  return (
    <div className="space-y-4">
      <PageHero title="岗位能力建模中心" description="按计划书要求支持岗位信息、能力标签、权重与熟练度的结构化建模，并可通过 AI 从描述生成模型。" tags={["岗位建模", "能力权重", "熟练度阈值", "模板复用"]} />
      <EnterpriseJobsCenterWorkbench initialData={data} />
    </div>
  );
}

