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

const roleOptions: { key: PlatformRole; label: string; hint: string }[] = [
  { key: "student", label: "学生端", hint: "成长/求职训练与简历投递" },
  { key: "enterprise", label: "企业端", hint: "人才库/招聘与分析看板" },
  { key: "school", label: "高校端", hint: "学生画像/培养诊断与干预" },
];

export default function RegisterPage() {
  return (
    <React.Suspense
      fallback={
        <main className="flex min-h-[100dvh] items-center justify-center px-4">
          <p className="text-sm text-white/50">加载中…</p>
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="注册对应端账号"
      description="账号按端入库隔离：学生端、企业端、高校端分别注册、分别登录，避免跨端误用。"
    >
      <div className="space-y-5">
        <div>
          <p className="font-qdisplay text-2xl font-semibold tracking-tight text-white">注册</p>
          <p className="mt-1 text-sm text-white/55">
            当前：{roleMeta.label} · {roleMeta.hint}
          </p>
        </div>

        <RoleSelector value={role} onChange={setRole} />

        <form onSubmit={onSubmit} className="space-y-4">
          <FormField label="昵称 / 姓名">
            <AuthInput
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例如：张同学 / 企业 HR / 就业老师"
            />
          </FormField>

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
              autoComplete="new-password"
            />
          </FormField>

          {isTrialGatedRole(role) ? (
            <FormField label="开发者密钥" hint="高校端与企业端需凭开发者密钥注册。">
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
                  还没有？{" "}
                  <Link className="text-cyan-300 hover:underline" href="/register/company">
                    注册公司并获取 company id
                  </Link>
                </>
              }
            >
              <AuthInput
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                placeholder="先完成公司注册后获得的 company id"
                autoComplete="off"
                className="font-quantum text-sm"
              />
            </FormField>
          ) : null}

          {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

          <Button disabled={loading} className="w-full active:scale-[0.98]" type="submit">
            {loading ? "注册中..." : "注册并进入"}
          </Button>

          <p className="text-center text-sm text-white/50">
            已有账号？{" "}
            <Link className="font-medium text-cyan-300 hover:text-cyan-200" href={`/login?role=${role}`}>
              去登录
            </Link>
          </p>
        </form>
      </div>
    </AuthShell>
  );
}
