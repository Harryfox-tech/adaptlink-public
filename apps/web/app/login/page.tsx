"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PlatformRole } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const roleOptions: { key: PlatformRole; label: string; hint: string; defaultPath: string }[] = [
  { key: "student", label: "学生端", hint: "成长/求职训练与简历投递", defaultPath: "/student/dashboard" },
  { key: "enterprise", label: "企业端", hint: "人才库/招聘与分析看板", defaultPath: "/enterprise/dashboard" },
  { key: "school", label: "高校端", hint: "学生画像/培养诊断与干预", defaultPath: "/school/dashboard" },
];

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
          <div className="text-sm text-muted-foreground">加载中…</div>
        </main>
      }
    >
      <LoginPageInner />
    </React.Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preRole = searchParams.get("role") as PlatformRole | null;
  const next = searchParams.get("next");
  const preEmail = searchParams.get("email") ?? "";
  const preCompanyId = searchParams.get("companyId") ?? "";

  const [role, setRole] = React.useState<PlatformRole>(
    preRole && ["student", "enterprise", "school"].includes(preRole) ? preRole : "student",
  );
  const [email, setEmail] = React.useState(preEmail);
  const [password, setPassword] = React.useState("");
  const [companyId, setCompanyId] = React.useState(preCompanyId);
  const [loading, setLoading] = React.useState(false);
  const [redirecting, setRedirecting] = React.useState(false);
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
    setRedirecting(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          email,
          password,
          ...(role === "enterprise" ? { companyId: companyId.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "登录失败");

      setRedirecting(true);
      router.replace(next || roleMeta.defaultPath);
      router.refresh();
    } catch (err: any) {
      setError(err?.message || "登录失败");
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
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">登录到对应端后台</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              请选择你要登录的端。只有该端注册的账号才能登录该端；三端账号数据分开入库。
            </p>
          </div>
        </div>

        <Card className="reveal-in border-[#dce7fb] shadow-sm">
          <CardHeader>
            <CardTitle>登录</CardTitle>
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
                  autoComplete="current-password"
                />
              </div>

              {role === "enterprise" ? (
                <div className="space-y-1">
                  <div className="text-sm font-medium">Company ID（公司编号）</div>
                  <Input
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value)}
                    placeholder="与注册企业账号时绑定的 company id 一致"
                    autoComplete="off"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    还没有公司编号？{" "}
                    <Link className="font-medium text-[#2d4cc8] hover:underline" href="/register/company">
                      先注册公司
                    </Link>
                  </p>
                </div>
              ) : null}

              {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
              {redirecting ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  登录成功，正在跳转至{roleMeta.label}首页…
                </div>
              ) : null}

              <Button disabled={loading || redirecting} className="w-full" type="submit">
                {redirecting ? "跳转中..." : loading ? "登录中..." : "登录"}
              </Button>

              <div className="text-sm text-muted-foreground">
                还没有账号？{" "}
                <Link className="font-medium text-[#2d4cc8] hover:underline" href={`/register?role=${role}`}>
                  去注册
                </Link>
                {role === "enterprise" ? (
                  <>
                    {" · "}
                    <Link className="font-medium text-[#2d4cc8] hover:underline" href="/register/company">
                      注册公司（获取 company id）
                    </Link>
                  </>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

