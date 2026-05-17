import { getJobRecommendations } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { JobRecommendationList } from "@/components/simulator/job-recommendation-list";

export default async function StudentRecommendationsPage() {
  const recommendations = await getJobRecommendations("stu_001");

  return (
    <div className="space-y-4">
      <section className="mb-6 space-y-3 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">岗位推荐中心</h1>
        <p className="text-[14px] leading-[22px] text-white/65">基于能力画像、模拟器表现与岗位画像映射生成个性化推荐，可直接进入投递流程。</p>
        <div className="flex flex-wrap gap-2">
          <Badge>画像映射</Badge>
          <Badge>匹配评分</Badge>
          <Badge>岗位投递</Badge>
        </div>
      </section>
      <JobRecommendationList jobs={recommendations.items} showApplyAction />
    </div>
  );
}
