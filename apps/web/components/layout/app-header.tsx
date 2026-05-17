 "use client";

import Link from "next/link";
import * as React from "react";
import { PlatformRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type NavItem = { label: string; href: string };

const navMap: Record<PlatformRole, NavItem[]> = {
  student: [
    { label: "学生首页", href: "/student/dashboard" },
    { label: "成长档案", href: "/student/profile" },
    { label: "成长模拟", href: "/student/simulators/growth" },
    { label: "求职模拟", href: "/student/simulators/job" },
    { label: "岗位推荐", href: "/student/recommendations" },
    { label: "投递中心", href: "/student/applications" },
    { label: "AI 助手", href: "/student/assistant" },
  ],
  enterprise: [
    { label: "招聘总览", href: "/enterprise/dashboard" },
    { label: "岗位建模", href: "/enterprise/jobs" },
    { label: "候选人工作台", href: "/enterprise/talent-pool" },
    { label: "流程协同", href: "/enterprise/recruitment" },
    { label: "校企协同", href: "/enterprise/partnerships" },
    { label: "数据洞察", href: "/enterprise/analytics" },
    { label: "权限治理", href: "/enterprise/settings" },
  ],
  school: [
    { label: "培养诊断总览", href: "/school/dashboard" },
    { label: "学生画像管理", href: "/school/students" },
    { label: "课程分析", href: "/school/curriculum" },
    { label: "项目招募", href: "/school/projects" },
    { label: "就业去向", href: "/school/employment" },
    { label: "干预任务", href: "/school/interventions" },
    { label: "校企协同", href: "/school/partnerships" },
    { label: "决策报告", href: "/school/analytics" },
    { label: "权限治理", href: "/school/settings" },
  ],
};

const roleText: Record<PlatformRole, string> = {
  student: "学生端",
  enterprise: "企业端",
  school: "高校端",
};

export function AppHeader({ role, title, pathname }: { role: PlatformRole; title: string; pathname: string }) {
  const roleNav = navMap[role];
  const [me, setMe] = React.useState<{ user: { role: PlatformRole; email: string; display_name: string } | null } | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as any;
        if (!cancelled) {
          setMe(data);
          setDraftName(data?.user?.display_name ?? "");
        }
      } catch {
        if (!cancelled) setMe({ user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    setSaveError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: draftName }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error ?? "更新失败");
      setMe({ user: data.user });
      setEditing(false);
    } catch (e: any) {
      setSaveError(e?.message ?? "更新失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30">
      <div className="mx-auto max-w-[1480px] px-6 pt-5">
        <div
          className={cn(
            "flex h-[56px] items-center justify-between px-5",
            "rounded-[22px] border border-white/10 bg-white/5 backdrop-blur-md",
            "shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5",
          )}
        >
          <div className="flex items-center gap-3">
            <Link href="/" className="font-qdisplay text-sm font-semibold tracking-tight text-white">
              AdaptLink
            </Link>
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 md:inline-flex">
              {roleText[role]} · {title}
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 text-[12px] text-white/70 backdrop-blur-md">
              <Link
                href="/student/dashboard"
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  role === "student" ? "bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.18)]" : "hover:text-white",
                )}
              >
                学生
              </Link>
              <Link
                href="/enterprise/dashboard"
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  role === "enterprise" ? "bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.18)]" : "hover:text-white",
                )}
              >
                企业
              </Link>
              <Link
                href="/school/dashboard"
                className={cn(
                  "rounded-full px-4 py-2 transition",
                  role === "school" ? "bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.18)]" : "hover:text-white",
                )}
              >
                高校
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pb-2">
          <nav className="flex h-10 items-center gap-4 overflow-x-auto whitespace-nowrap text-sm lg:hidden">
            {roleNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "transition-colors",
                    active ? "text-cyan-200" : "text-white/60 hover:text-white",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {me?.user ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/80 backdrop-blur-md shadow-[0_0_15px_rgba(45,212,191,0.12)]">
                <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-white/70">
                  {roleText[me.user.role]}
                </span>
                {!editing ? (
                  <>
                    <span className="font-medium">{me.user.display_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-white/75 hover:bg-white/10 hover:text-white"
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      className="h-7 w-40 border border-white/10 bg-white/5 text-white placeholder:text-white/40 focus-visible:ring-cyan-300/30"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <Button
                      size="sm"
                      className="h-7 px-2 bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25"
                      disabled={saving}
                      onClick={saveProfile}
                    >
                      {saving ? "保存中" : "保存"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                      onClick={() => {
                        setEditing(false);
                        setDraftName(me.user?.display_name ?? "");
                      }}
                    >
                      取消
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:underline" href={`/login?role=${role}`}>
                去登录
              </Link>
            )}
          </div>
        </div>

        {saveError ? (
          <div className="pb-2 text-xs text-red-300">{saveError}</div>
        ) : null}
      </div>
    </header>
  );
}
