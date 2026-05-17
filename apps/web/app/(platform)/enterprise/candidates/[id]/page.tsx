import { getEnterpriseCandidateDetail } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

function suggestInterviewQuestions(riskFlags: string[]) {
  const base = ["请举例说明你如何在资源受限情况下推进任务落地。", "当团队意见冲突时，你如何协调并达成一致？"];
  if (riskFlags.join("|").includes("沟通")) {
    base.push("请复盘一次高压场景下的沟通失误，你如何修正？");
  }
  if (riskFlags.join("|").includes("业务")) {
    base.push("给你一个陌生业务目标，你会如何拆解关键指标与行动路径？");
  }
  return base;
}

export default async function EnterpriseCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const detail = await getEnterpriseCandidateDetail(token, id);

  const avgAbility = detail.abilitySnapshot.length
    ? Math.round(detail.abilitySnapshot.reduce((sum, item) => sum + item.score, 0) / detail.abilitySnapshot.length)
    : detail.overallScore;
  const interviewQuestions = suggestInterviewQuestions(detail.riskFlags);

  return (
    <div className="space-y-4">
      <PageHero
        title={`候选人解释详情 #${id}`}
        description="围绕能力证据、TAI 解释、风险提示与面试建议进行结构化决策。"
        tags={["能力证据", "TAI 解释", "风险提示", "面试建议", "路径潜力"]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{detail.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>专业：{detail.major}</p>
            <p>年级：{detail.grade}</p>
            <p>TAI 综合分：{detail.overallScore}</p>
            <p>能力均值：{avgAbility}</p>
            <Progress value={detail.overallScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>标签与风险</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="mb-2 text-xs text-muted-foreground">优势标签</p>
              <div className="flex flex-wrap gap-2">
                {detail.strengths.map((item) => (
                  <Badge key={item} className="bg-emerald-100 text-emerald-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs text-muted-foreground">风险提示</p>
              <div className="flex flex-wrap gap-2">
                {detail.riskFlags.length === 0 ? <Badge className="bg-emerald-100 text-emerald-700">低风险</Badge> : null}
                {detail.riskFlags.map((item) => (
                  <Badge key={item} className="bg-amber-100 text-amber-700">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>能力快照（可追溯）</CardTitle>
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
            <CardTitle>岗位匹配建议</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>岗位</TableHead>
                  <TableHead>企业</TableHead>
                  <TableHead>匹配度</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.recommendations.map((item) => (
                  <TableRow key={item.jobId}>
                    <TableCell>{item.title}</TableCell>
                    <TableCell>{item.company}</TableCell>
                    <TableCell>{item.matchScore}</TableCell>
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
            <CardTitle>面试追问建议</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#4a619a]">
            {interviewQuestions.map((question) => (
              <p key={question} className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">
                {question}
              </p>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>路径潜力判断</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-[#4a619a]">
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">3-6 个月内可通过项目训练补齐关键短板，建议纳入可培养人才池。</p>
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">若进入面试后期，可优先安排业务场景题验证问题拆解能力。</p>
            <p className="rounded-lg border border-[#dce7fb] bg-[#f7faff] p-3">建议与“数据表达/跨团队协作”训练计划绑定，提升转化稳定性。</p>
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

      <Card>
        <CardHeader>
          <CardTitle>投递证据包（简历 + 解析 + 他测 + 模拟）</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {detail.applicationPackages.length === 0 ? (
            <p className="text-sm text-muted-foreground">该候选人暂无完整投递证据包。</p>
          ) : (
            detail.applicationPackages.map((pack) => (
              <div key={pack.applicationId} className="space-y-2 rounded-lg border border-[#dce7fb] p-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <Badge>{pack.applicationId}</Badge>
                  <Badge className="bg-sky-100 text-sky-700">{pack.jobTitle}</Badge>
                  <Badge className="bg-emerald-100 text-emerald-700">简历匹配 {pack.resumeAnalysis.analysis.fitScore}</Badge>
                  <Badge className="bg-amber-100 text-amber-700">他测 {pack.assessmentResult.overallScore}</Badge>
                </div>
                <p className="text-muted-foreground">{pack.resumeAnalysis.analysis.fitSummary}</p>
                <p>简历文件：{pack.resumeName}</p>
                <p>他测结论：{pack.assessmentResult.summary}</p>
                <p>历史模拟条数：{pack.simulationDigest.length}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
