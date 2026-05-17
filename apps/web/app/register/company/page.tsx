"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
    } catch (err: any) {
      setError(err?.message || "公司注册失败");
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
    <main className="mx-auto flex min-h-dvh max-w-6xl items-center justify-center px-4 py-10">
      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <div className="hidden md:flex md:flex-col md:justify-center">
          <div className="reveal-in max-w-md">
            <div className="text-sm font-semibold text-[#2d4cc8]">Adaptlink 平台</div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">注册公司</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              先创建公司实体，系统会生成唯一的 <strong>company id</strong>。企业端账号注册与登录时必须填写该 id，以便数据归属到正确公司。
            </p>
          </div>
        </div>

        <Card className="reveal-in border-[#dce7fb] shadow-sm">
          <CardHeader>
            <CardTitle>公司注册</CardTitle>
            <CardDescription>创建后将获得 company id，请妥善保存。</CardDescription>
          </CardHeader>
          <CardContent>
            {!result ? (
              <form onSubmit={onSubmit} className="space-y-3">
                <div className="space-y-1">
                  <div className="text-sm font-medium">开发者密钥</div>
                  <Input
                    value={developerKey}
                    onChange={(e) => setDeveloperKey(e.target.value)}
                    type="password"
                    placeholder="试商用密钥（企业端必填）"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-medium">公司名称</div>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：星澜科技有限公司" />
                </div>
                {error ? (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
                ) : null}
                <Button disabled={loading || !name.trim() || !developerKey.trim()} className="w-full" type="submit">
                  {loading ? "提交中..." : "创建公司并获取 company id"}
                </Button>
                <div className="text-sm text-muted-foreground">
                  <Link className="font-medium text-[#2d4cc8] hover:underline" href="/login?role=enterprise">
                    返回企业端登录
                  </Link>
                  {" · "}
                  <Link className="font-medium text-[#2d4cc8] hover:underline" href="/register?role=enterprise">
                    已有 company id？去注册企业账号
                  </Link>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                  <p className="font-medium">公司「{result.name}」已创建</p>
                  <p className="mt-2 font-mono text-xs break-all">
                    company id：<span className="select-all font-semibold">{result.company_id}</span>
                  </p>
                </div>
                <Button type="button" className="w-full" onClick={goEnterpriseRegister}>
                  使用该 company id 注册企业账号
                </Button>
                <Link href={`/login?role=enterprise&companyId=${encodeURIComponent(result.company_id)}`} className="block text-center text-sm text-[#2d4cc8] hover:underline">
                  已有企业账号？去登录（已带上 company id）
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
