"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { PlatformRole } from "@/lib/types";
import { PlatformShell } from "@/components/layout/platform-shell";

const titleMap: Record<PlatformRole, string> = {
  student: "学生成长与求职中心",
  enterprise: "企业人才决策中心",
  school: "高校培养诊断中心",
};

export function RoleShell({ role, children }: { role: PlatformRole; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <PlatformShell role={role} pathname={pathname} title={titleMap[role]}>
      {children}
    </PlatformShell>
  );
}
