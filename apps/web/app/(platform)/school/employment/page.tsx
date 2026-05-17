import { getSchoolEmploymentData } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function SchoolEmploymentPage() {
  const data = await getSchoolEmploymentData();

  return (
    <div className="space-y-4">
      <PageHero title="就业去向与岗位适配" description="从行业、岗位族与区域维度评估就业质量，追踪毕业去向与能力适配度。" tags={["就业质量", "岗位适配", "回流反馈"]} />
      <Card><CardHeader><CardTitle>专业去向分析</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>专业</TableHead><TableHead>主流去向</TableHead><TableHead>适配度</TableHead><TableHead>质量判断</TableHead></TableRow></TableHeader><TableBody>{data.major_rows.map((row) => <TableRow key={row.major}><TableCell className="font-medium text-[#2341a8]">{row.major}</TableCell><TableCell>{row.target}</TableCell><TableCell>{row.match}</TableCell><TableCell>{row.quality}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
