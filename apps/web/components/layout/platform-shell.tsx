import * as React from "react";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { PlatformRole } from "@/lib/types";

export function PlatformShell({
  role,
  pathname,
  title,
  children,
}: {
  role: PlatformRole;
  pathname: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="app-grain relative min-h-[100dvh] bg-[hsl(222,47%,6%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.028)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.028)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_50%_0%,#000_0%,transparent_70%)]" />
        <div className="absolute -left-24 top-0 h-[480px] w-[480px] rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute -right-32 top-16 h-[420px] w-[420px] rounded-full bg-sky-500/6 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[380px] w-[380px] rounded-full bg-cyan-600/5 blur-3xl" />
      </div>
      <AppHeader role={role} title={title} pathname={pathname} />
      <div className="relative mx-auto flex w-full max-w-7xl gap-6 px-4 pb-10 pt-[5.75rem] md:px-6">
        <AppSidebar role={role} pathname={pathname} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
