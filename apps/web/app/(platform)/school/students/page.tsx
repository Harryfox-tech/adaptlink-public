import Link from "next/link";
import { getSchoolStudentSummaries } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function riskBadge(level: string) {
  if (level === "high") return "bg-rose-100 text-rose-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
}

function interventionHint(level: string) {
  if (level === "high") return "建议 7 天内启动导师干预";
  if (level === "medium") return "建议纳入本月能力提升计划";
  return "建议进入进阶项目与企业课题池";
}

export default async function SchoolStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ risk_level?: string; min_score?: string }>;
}) {
  const params = await searchParams;
  const minScore = params.min_score ? Number(params.min_score) : undefined;

  const students = await getSchoolStudentSummaries({
    riskLevel: params.risk_level,
    minScore: Number.isFinite(minScore) ? minScore : undefined,
  });

  const highRiskCount = students.filter((item) => item.riskLevel === "high").length;
  const avgScore = students.length
    ? Math.round((students.reduce((sum, item) => sum + item.overallScore, 0) / students.length) * 10) / 10
    : 0;

  return (
    <div className="space-y-4">
      <PageHero
        title="学生能力画像管理"
        description="按学院/专业/风险层级查看学生画像，支持分层干预、项目招募与就业适配跟踪。"
        tags={["分层画像", "风险预警", "干预追踪", "项目招募"]}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">覆盖学生</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#1f3ea5]">{students.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">高风险人数</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-rose-600">{highRiskCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">平均综合分</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-[#1f3ea5]">{avgScore}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Link href="/school/students">
            <Badge>全部</Badge>
          </Link>
          <Link href="/school/students?risk_level=high">
            <Badge className="bg-rose-100 text-rose-700">高风险</Badge>
          </Link>
          <Link href="/school/students?risk_level=medium">
            <Badge className="bg-amber-100 text-amber-700">中风险</Badge>
          </Link>
          <Link href="/school/students?risk_level=low">
            <Badge className="bg-emerald-100 text-emerald-700">低风险</Badge>
          </Link>
          <Link href="/school/students?min_score=80">
            <Badge className="bg-sky-100 text-sky-700">80分以上</Badge>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>学生画像列表（{students.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学生</TableHead>
                <TableHead>专业</TableHead>
                <TableHead>综合分</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>最近模拟</TableHead>
                <TableHead>干预建议</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((item) => (
                <TableRow key={item.userId}>
                  <TableCell>
                    <Link href={`/school/students/${item.userId}`} className="font-medium text-[#2441a9] hover:underline">
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>{item.major}</TableCell>
                  <TableCell className="font-medium">{item.overallScore}</TableCell>
                  <TableCell>
                    <Badge className={riskBadge(item.riskLevel)}>{item.riskLevel}</Badge>
                  </TableCell>
                  <TableCell>{item.latestSimulationType}</TableCell>
                  <TableCell>{interventionHint(item.riskLevel)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
