import Link from "next/link";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";
import { getEnterpriseApplicationPackage } from "@/lib/api/client";
import { PageHero } from "@/components/dashboard/page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EnterpriseApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const pkg = await getEnterpriseApplicationPackage(token, id);

  return (
    <div className="space-y-4">
      <PageHero
        title={`投递包详情 #${id}`}
        description="企业端可直接查看学生端投递包（简历、简历分析、他测结果与模拟摘要）。"
        tags={["投递包", "证据链", "可追溯"]}
      />

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>投递包内容</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {pkg ? (
              <pre className="max-h-[520px] overflow-auto rounded-[16px] border border-white/10 bg-white/[0.04] p-4 text-xs text-white/70">
                {JSON.stringify(pkg, null, 2)}
              </pre>
            ) : (
              <p className="font-quantum text-sm text-white/55">未找到投递包，或你无权限访问。</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 font-quantum text-sm text-white/60">
            <Link href="/enterprise/applications" className="block rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 hover:bg-white/[0.06]">
              ← 返回收件箱
            </Link>
            <Link href="/enterprise/talent-pool" className="block rounded-[14px] border border-white/10 bg-white/[0.04] px-4 py-3 hover:bg-white/[0.06]">
              打开候选人工作台 →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

