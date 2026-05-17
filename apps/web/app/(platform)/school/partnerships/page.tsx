import { getSchoolPartnershipsData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SchoolPartnershipsPage() {
  const data = await getSchoolPartnershipsData();

  return (
    <div className="space-y-4">
      <PageHero title="校企协同与企业反馈面板" description="管理合作项目并沉淀企业反馈，将能力落差回流至课程与干预策略。" tags={["合作项目", "企业反馈", "能力落差", "课程回流"]} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>合作项目清单</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>企业</TableHead><TableHead>合作方向</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{data.partners.map((item) => <TableRow key={item.company}><TableCell className="font-medium text-[#2341a8]">{item.company}</TableCell><TableCell>{item.focus}</TableCell><TableCell>{item.status}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>企业反馈面板</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>企业</TableHead><TableHead>优势评价</TableHead><TableHead>能力落差</TableHead><TableHead>优先级</TableHead></TableRow></TableHeader><TableBody>{data.feedback_rows.map((item) => <TableRow key={item.company}><TableCell className="font-medium text-[#2341a8]">{item.company}</TableCell><TableCell>{item.praise}</TableCell><TableCell>{item.gap}</TableCell><TableCell>{item.priority}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>回流建议</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-[#4a619a]"><p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">将“业务表达”纳入低年级项目汇报评分标准。</p><p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">在课程分析中心提升“数据复盘”相关实践任务权重。</p><p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">对高频能力落差项建立月度改进跟踪机制。</p><Badge className="bg-[#eaf1ff] text-[#2140a6]">企业反馈默认进入决策报告模板</Badge></CardContent></Card>
    </div>
  );
}
