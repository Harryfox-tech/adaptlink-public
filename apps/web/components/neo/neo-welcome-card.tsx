"use client";

import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { PlatformRole } from "@/lib/types";
import { GlassCard } from "@/components/neo/glass-card";

const roleText: Record<PlatformRole, string> = {
  student: "学生",
  enterprise: "企业",
  school: "高校",
};

export function NeoWelcomeCard({
  role,
  imageSrc = "/pic/new1.png",
}: {
  role: PlatformRole;
  imageSrc?: string;
}) {
  const [me, setMe] = React.useState<{ user: { role: PlatformRole; email: string; display_name: string } | null } | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as any;
        if (!cancelled) setMe(data);
      } catch {
        if (!cancelled) setMe({ user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = me?.user?.display_name || "欢迎回来";
  const ctaHref = role === "student" ? "/student/applications" : role === "enterprise" ? "/enterprise/jobs" : "/school/students";

  return (
    <GlassCard className="flex h-[152px] items-center justify-between px-6">
      <div className="max-w-[520px]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
          {roleText[role]}端
        </div>
        <div className="mt-3 text-[20px] font-semibold text-white">
          你好，{displayName}!
        </div>
        <div className="mt-2 text-[12px] leading-[18px] text-white/70">
          已完成多智能体评估。继续从简历解析、模拟训练与投递进度推进下一步。
        </div>
        <Link href={ctaHref} className="mt-2 inline-flex text-[12px] font-medium text-cyan-300 underline underline-offset-4 hover:text-cyan-200">
          下一步 →
        </Link>
      </div>

      <div className="relative h-[120px] w-[320px] overflow-hidden rounded-[18px] bg-slate-950/40">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(220px_circle_at_70%_20%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(220px_circle_at_30%_80%,rgba(14,165,233,0.14),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/35 via-transparent to-slate-950/0" />
        <div className="absolute right-0 top-0 h-full w-full">
          <Image
            src={imageSrc}
            alt="3d"
            fill
            className="object-contain object-right"
          />
        </div>
      </div>
    </GlassCard>
  );
}

