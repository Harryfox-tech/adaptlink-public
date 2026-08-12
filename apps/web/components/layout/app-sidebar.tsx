"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { PlatformRole } from "@/lib/types";
import { cn } from "@/lib/utils";

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
    { label: "岗位建模中心", href: "/enterprise/jobs" },
    { label: "候选人工作台", href: "/enterprise/talent-pool" },
    { label: "投递收件箱", href: "/enterprise/applications" },
    { label: "流程协同", href: "/enterprise/recruitment" },
    { label: "校企协同", href: "/enterprise/partnerships" },
    { label: "数据洞察", href: "/enterprise/analytics" },
    { label: "权限与治理", href: "/enterprise/settings" },
  ],
  school: [
    { label: "培养诊断总览", href: "/school/dashboard" },
    { label: "学生画像管理", href: "/school/students" },
    { label: "专业与课程分析", href: "/school/curriculum" },
    { label: "项目招募中心", href: "/school/projects" },
    { label: "就业去向分析", href: "/school/employment" },
    { label: "干预任务中心", href: "/school/interventions" },
    { label: "校企协同管理", href: "/school/partnerships" },
    { label: "决策报告中心", href: "/school/analytics" },
    { label: "权限与治理", href: "/school/settings" },
  ],
};

const roleName: Record<PlatformRole, string> = {
  student: "学生端",
  enterprise: "企业端",
  school: "高校端",
};

export function AppSidebar({ role, pathname }: { role: PlatformRole; pathname: string }) {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = React.useState(false);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace(`/login?role=${role}`);
      router.refresh();
      setLoggingOut(false);
    }
  }

  return (
    <aside
      className={cn(
        "hidden h-[calc(100vh-7.5rem)] w-[260px] flex-col rounded-[22px] p-5 text-white lg:flex",
        "border border-white/10 bg-white/5 backdrop-blur-md",
        "shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5",
        "relative overflow-hidden",
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-110px] left-12 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_0_18px_rgba(34,211,238,0.15)]" />
        <div>
          <p className="font-qdisplay text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">AdaptLink</p>
          <p className="mt-0.5 font-qdisplay text-[16px] font-semibold">{roleName[role]}</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
        {navMap[role].map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative rounded-[14px] px-4 py-3 text-[13px] font-medium transition",
                active
                  ? "bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)] border border-cyan-300/20"
                  : "border border-transparent text-white/80 hover:bg-white/7 hover:text-white hover:border-white/10",
              )}
            >
              {active ? <span className="absolute left-1 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.7)]" /> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={() => void logout()}
        disabled={loggingOut}
        className={cn(
          "mt-3 rounded-[14px] px-4 py-3 text-left text-[13px] font-medium transition-colors",
          loggingOut
            ? "border border-white/10 bg-white/5 text-white/70"
            : "border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white",
        )}
      >
        {loggingOut ? "退出中..." : "退出登录"}
      </button>
      </div>
    </aside>
  );
}
