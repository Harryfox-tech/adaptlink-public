import { getSchoolCurriculumData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { SchoolCurriculumWorkbench } from "@/components/school/curriculum-workbench";

export default async function SchoolCurriculumPage() {
  const data = await getSchoolCurriculumData();

  return (
    <div className="space-y-4">
      <PageHero title="专业与课程分析中心" description="构建课程-能力-学生三层映射，定位课程贡献与市场能力缺口，支撑培养方案迭代。" tags={["课程映射", "能力贡献", "供需差距", "方案迭代"]} />
      <SchoolCurriculumWorkbench initialData={data} />
    </div>
  );
}

