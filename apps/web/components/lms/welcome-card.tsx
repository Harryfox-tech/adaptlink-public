"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { PlatformRole } from "@/lib/types";

const roleText: Record<PlatformRole, string> = {
  student: "学生端",
  enterprise: "企业端",
  school: "高校端",
};

export function WelcomeCard({
  role,
  title,
  description,
  ctaLabel,
  ctaHref,
  imageSrc = "/pic/person-laptop.png",
}: {
  role: PlatformRole;
  title?: string;
  description?: string;
  ctaLabel?: string;
  ctaHref?: string;
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
  const resolvedTitle = title ?? `你好，${displayName}！`;
  const resolvedDesc =
    description ??
    (role === "student"
      ? "今天可以从简历解析、能力评估与投递进度三件事开始。"
      : role === "enterprise"
        ? "今天可以从岗位建模、漏斗预警与候选人池三件事开始。"
        : "今天可以从供需诊断、课程优化与项目招募三件事开始。");
  const resolvedCtaLabel = ctaLabel ?? "立即查看";
  const resolvedCtaHref = ctaHref ?? (role === "student" ? "/student/applications" : role === "enterprise" ? "/enterprise/jobs" : "/school/students");

  return (
    <section className="flex h-[148px] items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-6 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
      <div className="max-w-[360px]">
        <div className="mb-1 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-semibold text-white/75">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]" />
          {roleText[role]}
        </div>
        <div className="text-[20px] font-semibold text-white">{resolvedTitle}</div>
        <div className="mt-2 text-[12px] leading-[18px] text-white/65">
          {resolvedDesc}
        </div>
        <Link href={resolvedCtaHref} className="mt-2 inline-block text-[12px] font-semibold text-cyan-300 underline underline-offset-4 hover:text-cyan-200">
          {resolvedCtaLabel}
        </Link>
      </div>

      <div className="relative h-[120px] w-[230px]">
        <div className="absolute inset-0 rounded-[18px] border border-white/10 bg-white/5" />
        <div className="pointer-events-none absolute inset-0 rounded-[18px] bg-[radial-gradient(220px_circle_at_70%_20%,rgba(34,211,238,0.18),transparent_60%),radial-gradient(220px_circle_at_30%_80%,rgba(168,85,247,0.18),transparent_60%)]" />
        <div className="absolute right-3 top-2 h-[108px] w-[172px]">
          <Image src={imageSrc} alt="welcome illustration" fill className="object-contain object-center" />
        </div>
      </div>
    </section>
  );
}

