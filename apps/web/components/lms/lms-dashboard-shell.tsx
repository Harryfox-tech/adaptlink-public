"use client";

import * as React from "react";
import { PlatformRole } from "@/lib/types";
import { LmsSidebar } from "@/components/lms/sidebar";
import { LmsTopHeader } from "@/components/lms/header";

export function LmsDashboardShell({
  title,
  modeLabel = "Light mode",
  role,
  children,
}: {
  title: string;
  modeLabel?: string;
  role: PlatformRole;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-dvh bg-[#3F57A7] px-8 py-10">
      <div className="mx-auto w-[1120px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="text-[42px] font-semibold text-white">{title}</div>
          <div className="rounded-full bg-white/15 px-5 py-2 text-[13px] font-medium text-white">{modeLabel}</div>
        </div>

        <div className="flex gap-6">
          <div className="shrink-0">
            <LmsSidebar role={role} />
          </div>

          <div className="flex-1">
            <LmsTopHeader />
            <div className="mt-5">{children}</div>
          </div>
        </div>
      </div>
    </main>
  );
}

