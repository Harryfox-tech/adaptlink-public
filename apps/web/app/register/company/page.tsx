"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/auth/auth-alert";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthInput, FormField } from "@/components/auth/form-field";
import { Button } from "@/components/ui/button";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [developerKey, setDeveloperKey] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<{ company_id: string; name: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, developerKey: developerKey.trim() }),
      });
      const data = (await res.json()) as { company_id?: string; name?: string; error?: string };
      if (!res.ok) throw new Error(data.error || "公司注册失败");
      if (!data.company_id) throw new Error("未返回 company id");
      setResult({ company_id: data.company_id, name: data.name ?? name });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "公司注册失败");
    } finally {
      setLoading(false);
    }
  }

  function goEnterpriseRegister() {
    if (!result) return;
    const qp = new URLSearchParams();
    qp.set("role", "enterprise");
    qp.set("companyId", result.company_id);
    router.push(`/register?${qp.toString()}`);
  }

  return (
    <AuthShell
      title="注册公司"
      description="先创建公司实体，系统会生成唯一的 company id。企业端账号注册与登录时必须填写该 id，以便数据归属到正确公司。"
    >
      <div className="space-y-5">
        <div>
          <p className="font-qdisplay text-2xl font-semibold tracking-tight text-white">公司注册</p>
          <p className="mt-1 text-sm text-white/55">创建后将获得 company id，请妥善保存。</p>
        </div>

        {!result ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="开发者密钥">
              <AuthInput
                value={developerKey}
                onChange={(e) => setDeveloperKey(e.target.value)}
                type="password"
                placeholder="试商用密钥"
                autoComplete="off"
              />
            </FormField>

            <FormField label="公司名称">
              <AuthInput value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：星澜科技有限公司" />
            </FormField>

            {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

            <Button
              disabled={loading || !name.trim() || !developerKey.trim()}
              className="w-full active:scale-[0.98]"
              type="submit"
            >
              {loading ? "提交中..." : "创建公司并获取 company id"}
            </Button>

            <p className="text-center text-sm text-white/50">
              <Link className="text-cyan-300 hover:text-cyan-200" href="/login?role=enterprise">
                返回企业端登录
              </Link>
              {" · "}
              <Link className="text-cyan-300 hover:text-cyan-200" href="/register?role=enterprise">
                已有 company id？去注册企业账号
              </Link>
            </p>
          </form>
        ) : (
          <div className="space-y-4">
            <AuthAlert tone="success">
              <p className="font-medium">公司「{result.name}」已创建</p>
              <p className="mt-2 font-quantum text-xs break-all">
                company id：<span className="select-all font-semibold">{result.company_id}</span>
              </p>
            </AuthAlert>
            <Button type="button" className="w-full active:scale-[0.98]" onClick={goEnterpriseRegister}>
              使用该 company id 注册企业账号
            </Button>
            <Link
              href={`/login?role=enterprise&companyId=${encodeURIComponent(result.company_id)}`}
              className="block text-center text-sm text-cyan-300 hover:text-cyan-200"
            >
              已有企业账号？去登录（已带上 company id）
            </Link>
          </div>
        )}
      </div>
    </AuthShell>
  );
}
