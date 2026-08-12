"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { PlatformRole } from "@/lib/types";
import { isTrialGatedRole } from "@/lib/trial-access";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthInput, FormField } from "@/components/auth/form-field";
import { RoleSelector } from "@/components/auth/role-selector";
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
        <main className="flex min-h-[100dvh] items-center justify-center px-4">
          <p className="text-sm text-white/50">加载中…</p>
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
  const [developerKey, setDeveloperKey] = React.useState("");
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
          ...(isTrialGatedRole(role) ? { developerKey: developerKey.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "登录失败");

      setRedirecting(true);
      router.replace(next || roleMeta.defaultPath);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="登录到对应端后台"
      description="请选择你要登录的端。只有该端注册的账号才能登录该端；三端账号数据分开入库。"
    >
      <div className="space-y-5">
        <div>
          <p className="font-qdisplay text-2xl font-semibold tracking-tight text-white">登录</p>
          <p className="mt-1 text-sm text-white/55">
            当前：{roleMeta.label} · {roleMeta.hint}
          </p>
        </div>

        <RoleSelector value={role} onChange={setRole} />

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="邮箱">
            <AuthInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              autoComplete="email"
            />
          </FormField>

          <FormField label="密码">
            <AuthInput
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="至少 6 位"
              autoComplete="current-password"
            />
          </FormField>

          {isTrialGatedRole(role) ? (
            <FormField label="开发者密钥" hint="高校端与企业端需凭开发者密钥登录。">
              <AuthInput
                value={developerKey}
                onChange={(e) => setDeveloperKey(e.target.value)}
                type="password"
                placeholder="试商用密钥"
                autoComplete="off"
              />
            </FormField>
          ) : null}

          {role === "enterprise" ? (
            <FormField
              label="Company ID"
              hint={
                <>
                  还没有公司编号？{" "}
                  <Link className="text-cyan-300 hover:underline" href="/register/company">
                    先注册公司
                  </Link>
                </>
              }
            >
              <AuthInput
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="与注册企业账号时绑定的 company id"
                autoComplete="off"
                className="font-quantum text-sm"
              />
            </FormField>
          ) : null}

          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}
          {redirecting ? (
            <AuthAlert tone="success">登录成功，正在跳转至{roleMeta.label}首页…</AuthAlert>
          ) : null}

          <Button disabled={loading || redirecting} className="w-full active:scale-[0.98]" type="submit">
            {redirecting ? "跳转中..." : loading ? "登录中..." : "登录"}
          </Button>

          <p className="text-center text-sm text-white/50">
            还没有账号？{" "}
            <Link className="font-medium text-cyan-300 hover:text-cyan-200" href={`/register?role=${role}`}>
              去注册
            </Link>
            {role === "enterprise" ? (
              <>
                {" · "}
                <Link className="font-medium text-cyan-300 hover:text-cyan-200" href="/register/company">
                  注册公司
                </Link>
              </>
            ) : null}
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
