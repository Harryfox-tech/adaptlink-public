import { getEnterprisePartnershipsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { EnterprisePartnershipsWorkbench } from "@/components/enterprise/partnerships-workbench";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterprisePartnershipsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterprisePartnershipsData(token);

  return (
    <div className="space-y-4">
      <PageHero title="校招协同看板" description="覆盖院校联系人、活动排期、协同质量评分与合作转化，构建可持续校企协同机制。" tags={["院校联系人", "活动排期", "协同评分", "转化复盘"]} />
      <EnterprisePartnershipsWorkbench initialData={data} />
    </div>
  );
}
