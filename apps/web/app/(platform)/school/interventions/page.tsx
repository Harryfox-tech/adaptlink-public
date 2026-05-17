import { getSchoolInterventionsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SchoolInterventionsPage() {
  const data = await getSchoolInterventionsData();

  return (
    <div className="space-y-4">
      <PageHero title="干预任务中心" description="按风险层级下发干预任务，跟踪执行状态并回流学生画像。" tags={["风险分层", "任务流转", "效果评估"]} />
      <div className="grid gap-4 md:grid-cols-3">{data.strategies.map((item) => <Card key={item.level}><CardHeader><CardTitle>{item.level}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[#4a619a]"><p>{item.strategy}</p><p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] px-3 py-2">责任人：{item.owner}</p></CardContent></Card>)}</div>
      <Card><CardHeader><CardTitle>执行规则</CardTitle></CardHeader><CardContent className="grid gap-2 text-sm text-[#4a619a] md:grid-cols-2">{data.rules.map((rule) => <p key={rule} className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">{rule}</p>)}</CardContent></Card>
    </div>
  );
}
