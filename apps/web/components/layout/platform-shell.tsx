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
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-indigo-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.035)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_50%_0%,#000_0%,transparent_72%)]" />
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[560px] rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(45,212,191,0.07),transparent_55%),radial-gradient(900px_circle_at_75%_15%,rgba(168,85,247,0.09),transparent_55%),radial-gradient(900px_circle_at_60%_85%,rgba(99,102,241,0.08),transparent_55%)]" />
        <div className="pointer-events-none absolute left-[12%] top-[22%] h-40 w-40 animate-[quantum-float_22s_ease-in-out_infinite] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute right-[18%] top-[38%] h-48 w-48 animate-[quantum-float_28s_ease-in-out_infinite_reverse] rounded-full bg-violet-500/10 blur-3xl [animation-delay:-4s]" />
        <div className="pointer-events-none absolute bottom-[20%] left-[40%] h-36 w-36 animate-[quantum-float_26s_ease-in-out_infinite] rounded-full bg-orange-400/8 blur-3xl [animation-delay:-8s]" />
      </div>
      <AppHeader role={role} title={title} pathname={pathname} />
      <div className="relative mx-auto flex w-full max-w-[1480px] gap-5 px-6 pb-10 pt-24">
        <AppSidebar role={role} pathname={pathname} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
