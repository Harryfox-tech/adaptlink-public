"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PlatformRole } from "@/lib/types";
import { isTrialGatedRole } from "@/lib/trial-access";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const roleOptions: { key: PlatformRole; label: string; hint: string; defaultPath: string }[] = [
  { key: "student", label: "学生端", hint: "成长/求职训练与简历投递", defaultPath: "/student/dashboard" },
  { key: "enterprise", label: "企业端", hint: "人才库/招聘与分析看板", defaultPath: "/enterprise/dashboard" },
  { key: "school", label: "高校端", hint: "学生画像/培养诊断与干预", defaultPath: "/school/dashboard" },
];

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
          <div className="text-sm text-muted-foreground">加载中…</div>
        </main>
      }
    >
      <RegisterPageInner />
    </React.Suspense>
  );
}

function RegisterPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preRole = searchParams.get("role") as PlatformRole | null;
  const preCompanyId = searchParams.get("companyId") ?? "";

  const [role, setRole] = React.useState<PlatformRole>(
    preRole && ["student", "enterprise", "school"].includes(preRole) ? preRole : "student",
  );
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [companyId, setCompanyId] = React.useState(preCompanyId);
  const [developerKey, setDeveloperKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const cid = searchParams.get("companyId");
    if (cid) setCompanyId(cid);
  }, [searchParams]);

  const roleMeta = roleOptions.find((r) => r.key === role)!;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email,
          password,
          displayName,
          ...(role === "enterprise" ? { companyId: companyId.trim() } : {}),
          ...(isTrialGatedRole(role) ? { developerKey: developerKey.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "注册失败");

      const qp = new URLSearchParams();
      qp.set("role", role);
      if (email.trim()) qp.set("email", email.trim());
      router.replace(`/login?${qp.toString()}`);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <div className="hidden md:flex md:flex-col md:justify-center">
          <div className="reveal-in max-w-md">
            <div className="text-sm font-semibold text-[#2d4cc8]">Adaptlink 平台</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">注册对应端账号</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              账号按端入库隔离：学生端/企业端/高校端分别注册、分别登录，避免跨端误用。
            </p>
          </div>
        </div>

        <Card className="reveal-in border-[#dce7fb] shadow-sm">
          <CardHeader>
            <CardTitle>注册</CardTitle>
            <CardDescription>
              当前：{roleMeta.label}（{roleMeta.hint}）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-2">
              {roleOptions.map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  variant={role === item.key ? "default" : "outline"}
                  onClick={() => setRole(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </div>

            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">昵称/姓名</div>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="例如：张同学 / 企业HR / 就业老师" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">邮箱</div>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-medium">密码</div>
                <Input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="至少 6 位"
                  autoComplete="new-password"
                />
              </div>

              {isTrialGatedRole(role) ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">开发者密钥</div>
                  <Input
                    value={developerKey}
                    onChange={(e) => setDeveloperKey(e.target.value)}
                    type="password"
                    placeholder="试商用密钥（高校端/企业端必填）"
                    autoComplete="off"
                  />
                  <p className="text-xs text-muted-foreground">本次试用中，高校端与企业端需凭开发者密钥注册。</p>
                </div>
              ) : null}

              {role === "enterprise" ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Company ID（公司编号）</div>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="先完成公司注册后获得的 company id"
                    autoComplete="off"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    还没有？{" "}
                    <Link className="font-medium text-[#2d4cc8] hover:underline" href="/register/company">
                      注册公司并获取 company id
                    </Link>
                  </p>
                </div>
              ) : null}

              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

              <Button disabled={loading} className="w-full" type="submit">
                {loading ? "注册中..." : "注册并进入"}
              </Button>

              <div className="text-sm text-muted-foreground">
                已有账号？{" "}
                <Link className="font-medium text-[#2d4cc8] hover:underline" href={`/login?role=${role}`}>
                  去登录
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

