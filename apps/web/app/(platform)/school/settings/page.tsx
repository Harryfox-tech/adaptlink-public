import { getSchoolSettingsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { SchoolSettingsWorkbench } from "@/components/school/settings-workbench";

export default async function SchoolSettingsPage() {
  const data = await getSchoolSettingsData();

  return (
    <div className="space-y-4">
      <PageHero title="权限与治理配置" description="配置高校端角色权限、报告口径与数据保护策略，保证教学治理闭环稳定运行。" tags={["角色权限", "隐私保护", "口径统一", "反馈回流"]} />
      <SchoolSettingsWorkbench initialData={data} />
    </div>
  );
}
