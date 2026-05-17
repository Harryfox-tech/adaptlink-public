import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";
import { getEnterpriseApplications } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

function statusBadge(status: string) {
  if (status.includes("面试")) return "border border-cyan-500/25 bg-cyan-500/12 text-cyan-100/90";
  if (status.includes("拒") || status.includes("淘汰")) return "border border-rose-500/25 bg-rose-500/12 text-rose-100/90";
  return "border border-white/10 bg-white/5 text-white/70";
}

export default async function EnterpriseApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string; jobId?: string; keyword?: string }>;
}) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const params = (await searchParams) ?? {};
  const items = await getEnterpriseApplications(token, {
    status: params.status,
    jobId: params.jobId,
    keyword: params.keyword,
    limit: 80,
    offset: 0,
  });

  return (
    <div className="space-y-4">
      <PageHero
        title="企业投递收件箱"
        description="按公司维度汇总所有岗位投递，可快速进入投递包详情进行复核与协同。"
        tags={["company 级可见", "投递包", "岗位归属", "可追溯"]}
      />

      <Card>
        <CardHeader>
          <CardTitle>投递列表（{items.length}）</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>投递 ID</TableHead>
                <TableHead>候选人</TableHead>
                <TableHead>岗位</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((it) => (
                <TableRow key={it.applicationId}>
                  <TableCell className="font-quantum text-white/80">{it.applicationId}</TableCell>
                  <TableCell className="font-qdisplay text-white/90">{it.studentId}</TableCell>
                  <TableCell className="text-white/70">
                    <div className="font-qdisplay text-white/90">{it.jobTitle}</div>
                    <div className="text-xs text-white/55">{it.company}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusBadge(it.status)}>{it.status}</Badge>
                  </TableCell>
                  <TableCell className="font-quantum text-white/60">{it.appliedAt.slice(0, 10)}</TableCell>
                  <TableCell className="text-right">
                    <Link
                      href={`/enterprise/applications/${encodeURIComponent(it.applicationId)}`}
                      className="font-quantum text-sm text-cyan-200/90 hover:underline"
                    >
                      查看投递包 →
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center font-quantum text-white/45">
                    暂无投递。请先在企业端发布岗位，并在学生端对该岗位发起投递。
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

