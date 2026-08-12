"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { FaThLarge, FaBookOpen, FaCalendarAlt, FaFolderOpen, FaComments, FaClipboardCheck, FaCog, FaSignOutAlt } from "react-icons/fa";
import { PlatformRole } from "@/lib/types";

type Item = {
  label: string;
  icon: React.ReactNode;
  href: string;
};

const roleItems: Record<PlatformRole, Item[]> = {
  student: [
    { label: "总览", href: "/student/dashboard", icon: <FaThLarge className="h-4 w-4" /> },
    { label: "成长档案", href: "/student/profile", icon: <FaBookOpen className="h-4 w-4" /> },
    { label: "模拟训练", href: "/student/simulators/growth", icon: <FaCalendarAlt className="h-4 w-4" /> },
    { label: "岗位推荐", href: "/student/recommendations", icon: <FaFolderOpen className="h-4 w-4" /> },
    { label: "投递进度", href: "/student/applications", icon: <FaClipboardCheck className="h-4 w-4" /> },
    { label: "AI 助手", href: "/student/assistant", icon: <FaComments className="h-4 w-4" /> },
    { label: "设置", href: "/student/profile", icon: <FaCog className="h-4 w-4" /> },
  ],
  enterprise: [
    { label: "总览", href: "/enterprise/dashboard", icon: <FaThLarge className="h-4 w-4" /> },
    { label: "岗位建模", href: "/enterprise/jobs", icon: <FaBookOpen className="h-4 w-4" /> },
    { label: "人才库", href: "/enterprise/talent-pool", icon: <FaFolderOpen className="h-4 w-4" /> },
    { label: "流程协同", href: "/enterprise/recruitment", icon: <FaClipboardCheck className="h-4 w-4" /> },
    { label: "校企合作", href: "/enterprise/partnerships", icon: <FaComments className="h-4 w-4" /> },
    { label: "数据洞察", href: "/enterprise/analytics", icon: <FaCalendarAlt className="h-4 w-4" /> },
    { label: "设置", href: "/enterprise/settings", icon: <FaCog className="h-4 w-4" /> },
  ],
  school: [
    { label: "总览", href: "/school/dashboard", icon: <FaThLarge className="h-4 w-4" /> },
    { label: "学生画像", href: "/school/students", icon: <FaBookOpen className="h-4 w-4" /> },
    { label: "课程分析", href: "/school/curriculum", icon: <FaFolderOpen className="h-4 w-4" /> },
    { label: "项目招募", href: "/school/projects", icon: <FaClipboardCheck className="h-4 w-4" /> },
    { label: "决策报告", href: "/school/analytics", icon: <FaCalendarAlt className="h-4 w-4" /> },
    { label: "设置", href: "/school/settings", icon: <FaCog className="h-4 w-4" /> },
    { label: "校企合作", href: "/school/partnerships", icon: <FaComments className="h-4 w-4" /> },
  ],
};

export function LmsSidebar({ role }: { role?: PlatformRole }) {
  const pathname = usePathname();
  const items = role ? roleItems[role] : roleItems.student;
  return (
    <aside className="relative flex h-full w-[260px] flex-col overflow-hidden rounded-[22px] border border-white/10 bg-white/5 px-5 py-6 text-white backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-20 top-10 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-110px] left-12 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>
      <div className="relative flex h-full flex-col">
      <div className="mb-7 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-[0_0_18px_rgba(34,211,238,0.15)]" />
        <div className="text-[18px] font-semibold leading-none">AdaptLink</div>
      </div>

      <nav className="flex-1 space-y-1">
        {items.map((it) => (
          <Link
            key={it.label}
            href={it.href}
            className={cn(
              "group flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-[13px] font-medium transition",
              pathname === it.href
                ? "border border-cyan-300/20 bg-white/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                : "border border-transparent text-white/80 hover:border-white/10 hover:bg-white/7 hover:text-white",
            )}
          >
            <span className={cn("opacity-90", pathname === it.href ? "text-cyan-200" : "text-white/80")}>{it.icon}</span>
            <span>{it.label}</span>
          </Link>
        ))}
      </nav>

      <button
        type="button"
        className="mt-4 flex items-center gap-3 rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 text-left text-[13px] font-medium text-white/85 hover:bg-white/10 hover:text-white"
      >
        <FaSignOutAlt className="h-4 w-4" />
        <span>退出登录</span>
      </button>
      </div>
    </aside>
  );
}

