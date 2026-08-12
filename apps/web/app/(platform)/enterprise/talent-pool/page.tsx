import Link from "next/link";
import { getEnterpriseTalentPool } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";
import {
  filterBadgeClass,
  filterSkyBadgeClass,
  labelRiskLevel,
  riskBadgeClass,
} from "@/lib/ui-labels";

function deriveCoverage(score: number) {
  return Math.max(55, Math.min(98, Math.round(score * 0.92)));
}
function deriveRelevance(score: number) {
  return Math.max(50, Math.min(96, Math.round(score * 0.89)));
}
function deriveAiLiteracy(score: number) {
  return Math.max(48, Math.min(95, Math.round(score * 0.84)));
}
function deriveGeneralAbility(score: number) {
  return Math.max(52, Math.min(97, Math.round(score * 0.9)));
}

const poolLayers = ["高潜未录用池", "校招储备池", "特定技能池", "实习转正池", "目标院校池"];

export default async function EnterpriseTalentPoolPage({
  searchParams,
}: {
  searchParams: Promise<{ keyword?: string; risk_level?: string; min_score?: string }>;
}) {
  const params = await searchParams;
  const minScore = params.min_score ? Number(params.min_score) : undefined;
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;

  const candidates = await getEnterpriseTalentPool(token, {
    keyword: params.keyword,
    riskLevel: params.risk_level,
    minScore: Number.isFinite(minScore) ? minScore : undefined,
  });

  const avgScore = candidates.length
    ? Math.round((candidates.reduce((sum, item) => sum + item.overallScore, 0) / candidates.length) * 10) / 10
    : 0;
  const highRisk = candidates.filter((item) => item.riskLevel === "high").length;
  const reusable = candidates.filter((item) => item.overallScore >= 78).length;

  return (
    <div className="space-y-4">
      <PageHero
        title="候选人筛选与解释工作台"
        description="围绕 TAI 综合分、能力覆盖度、风险提示与岗位相关性进行可解释筛选，并沉淀可复用人才池。"
        tags={["TAI 初筛", "可解释评估", "风险分层", "人才复用"]}
      />

      <Card>
        <CardHeader>
          <CardTitle>多层人才池</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-5">
          {poolLayers.map((layer) => (
            <p
              key={layer}
              className="rounded-[14px] border border-white/10 bg-white/[0.04] p-3 font-quantum text-white/70 backdrop-blur-md transition hover:border-cyan-400/20 hover:bg-white/[0.06]"
            >
              {layer}
            </p>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>对话式检索</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-[1fr_auto]">
          <Input placeholder="例如：TAI>80 且具备 Python + SQL + 协作能力强的 2026 届学生" />
          <Button type="button">检索</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/55">当前候选人</CardTitle>
          </CardHeader>
          <CardContent className="font-qdisplay text-3xl font-semibold text-cyan-300">{candidates.length}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/55">平均 TAI 综合分</CardTitle>
          </CardHeader>
          <CardContent className="font-qdisplay text-3xl font-semibold text-cyan-300">{avgScore}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-white/55">可复用人才（≥ 78）</CardTitle>
          </CardHeader>
          <CardContent className="font-qdisplay text-3xl font-semibold text-emerald-300">{reusable}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选快捷入口</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Link href="/enterprise/talent-pool">
            <Badge className={filterBadgeClass}>全部</Badge>
          </Link>
          <Link href="/enterprise/talent-pool?risk_level=high">
            <Badge className={riskBadgeClass("high")}>高风险（{highRisk}）</Badge>
          </Link>
          <Link href="/enterprise/talent-pool?risk_level=medium">
            <Badge className={riskBadgeClass("medium")}>中风险</Badge>
          </Link>
          <Link href="/enterprise/talent-pool?risk_level=low">
            <Badge className={riskBadgeClass("low")}>低风险</Badge>
          </Link>
          <Link href="/enterprise/talent-pool?min_score=80">
            <Badge className={filterSkyBadgeClass}>TAI 80+</Badge>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>候选人列表（{candidates.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>候选人</TableHead>
                <TableHead>专业/年级</TableHead>
                <TableHead>TAI 综合分</TableHead>
                <TableHead>覆盖度</TableHead>
                <TableHead>相关性</TableHead>
                <TableHead>AI 素养</TableHead>
                <TableHead>通用能力</TableHead>
                <TableHead>风险等级</TableHead>
                <TableHead>最近推荐</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((item) => (
                <TableRow key={item.studentId}>
                  <TableCell>
                    <Link
                      href={`/enterprise/candidates/${item.studentId}`}
                      className="font-medium text-cyan-300 hover:text-cyan-200 hover:underline"
                    >
                      {item.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {item.major} / {item.grade}
                  </TableCell>
                  <TableCell className="font-medium">{item.overallScore}</TableCell>
                  <TableCell>{deriveCoverage(item.overallScore)}</TableCell>
                  <TableCell>{deriveRelevance(item.overallScore)}</TableCell>
                  <TableCell>{deriveAiLiteracy(item.overallScore)}</TableCell>
                  <TableCell>{deriveGeneralAbility(item.overallScore)}</TableCell>
                  <TableCell>
                    <Badge className={riskBadgeClass(item.riskLevel)}>{labelRiskLevel(item.riskLevel)}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.latestRecommendationTitle
                      ? `${item.latestRecommendationTitle} (${item.latestRecommendationScore ?? "-"})`
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
