import { getSchoolProjectsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { SchoolProjectsWorkbench } from "@/components/school/projects-workbench";

export default async function SchoolProjectsPage() {
  const data = await getSchoolProjectsData();

  return (
    <div className="space-y-4">
      <PageHero title="科研/实践项目招募中心" description="按企业端建岗逻辑发布项目岗位，支持能力门槛、年级限制与过程反馈回流。" tags={["项目发布", "精准推送", "TAI 初筛", "过程反馈"]} />
      <SchoolProjectsWorkbench initialProjects={data.projects} />
    </div>
  );
}
