import { getSchoolStudentDetail } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function courseHints(focusAreas: string[]) {
  const hints: string[] = [];
  if (focusAreas.join("|").includes("沟通")) hints.push("建议加入“结构化表达与业务汇报”课程单元。 ");
  if (focusAreas.join("|").includes("业务")) hints.push("建议增加“行业案例拆解”项目作业，强化业务理解。 ");
  if (focusAreas.join("|").includes("数据")) hints.push("建议补充“数据分析与可视化”实训任务。 ");
  if (hints.length === 0) hints.push("建议进入进阶企业课题，强化跨场景迁移能力。 ");
  return hints;
}

export default async function SchoolStudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getSchoolStudentDetail(id);
  const courseSuggestions = courseHints(detail.focusAreas);

  return (
    <div className="space-y-4">
      <PageHero
        title={`学生画像详情 #${id}`}
        description="汇总能力证据、风险原因、干预任务与课程优化建议，支撑导师分层指导。"
        tags={["能力证据", "风险原因", "干预任务", "课程建议", "就业准备度"]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{detail.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>专业：{detail.major}</p>
            <p>年级：{detail.grade}</p>
            <p>风险等级：{detail.riskLevel}</p>
            <p>综合评分：{detail.overallScore}</p>
            <Progress value={detail.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>重点关注能力</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {detail.focusAreas.map((item) => (
                <Badge key={item} className="bg-amber-100 text-amber-700">
                  {item}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>能力快照（画像依据）</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>能力维度</TableHead>
                  <TableHead>分数</TableHead>
                  <TableHead>趋势</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.abilitySnapshot.map((item) => (
                  <TableRow key={item.abilityKey}>
                    <TableCell>{item.abilityLabel}</TableCell>
                    <TableCell>{item.score}</TableCell>
                    <TableCell>{item.trend}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>干预计划</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>任务</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>负责人</TableHead>
                  <TableHead>截止</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.interventions.map((item) => (
                  <TableRow key={`${item.title}-${item.dueDate}`}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.priority}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>{item.dueDate}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>课程与项目优化建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#4a619a]">
            {courseSuggestions.map((item) => (
              <p key={item} className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">
                {item}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>就业准备度判断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#4a619a]">
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">当前画像显示具备基础岗位胜任力，建议优先投递“项目协同型”岗位。</p>
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">完成本轮干预任务后，预计 4-8 周可提升面试稳定性。</p>
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">建议加入企业导师制项目，缩短课堂能力与岗位能力差距。</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>最近模拟记录</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session</TableHead>
                <TableHead>类型</TableHead>
                <TableHead>得分</TableHead>
                <TableHead>摘要</TableHead>
                <TableHead>时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.latestSimulations.map((item) => (
                <TableRow key={item.sessionId}>
                  <TableCell>{item.sessionId}</TableCell>
                  <TableCell>{item.simulationType}</TableCell>
                  <TableCell>{item.overallScore}</TableCell>
                  <TableCell>{item.summary}</TableCell>
                  <TableCell>{item.createdAt}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
