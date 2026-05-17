import { getEnterpriseSettingsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { EnterpriseSettingsWorkbench } from "@/components/enterprise/settings-workbench";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export default async function EnterpriseSettingsPage() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const data = await getEnterpriseSettingsData(token);

  return (
    <div className="space-y-4">
      <PageHero title="权限与数据治理" description="按计划书定义企业端角色权限与数据治理规则，保障协同可控、可追溯、可审计。" tags={["权限分层", "数据脱敏", "导出审计", "回流留痕"]} />
      <EnterpriseSettingsWorkbench initialData={data} />
    </div>
  );
}
