"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransformationProject } from "@/lib/types";

interface Props {
  project: TransformationProject;
  onClick?: () => void;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  achievement_push: { label: "成果供给", color: "bg-cyan-500/15 border-cyan-400/20 text-cyan-200" },
  demand_pull: { label: "需求发布", color: "bg-orange-500/15 border-orange-400/20 text-orange-200" },
  collaborative: { label: "合作机会", color: "bg-purple-500/15 border-purple-400/20 text-purple-200" },
};

const ROLE_LABELS: Record<string, { label: string; icon: string }> = {
  school: { label: "高校", icon: "🎓" },
  enterprise: { label: "企业", icon: "🏢" },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "对接中", color: "bg-green-500/15 border-green-400/20 text-green-200" },
  matched: { label: "已对接", color: "bg-blue-500/15 border-blue-400/20 text-blue-200" },
  closed: { label: "已关闭", color: "bg-white/8 border-white/10 text-white/40" },
};

export function TransformationProjectCard({ project, onClick }: Props) {
  const type = TYPE_LABELS[project.projectType] ?? TYPE_LABELS["achievement_push"];
  const role = ROLE_LABELS[project.creatorRole] ?? { label: project.creatorRole, icon: "👤" };
  const status = STATUS_LABELS[project.status] ?? STATUS_LABELS["open"];

  return (
    <div
      className="group cursor-pointer overflow-hidden rounded-[18px] border border-white/10 bg-white/[0.04] shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition-all duration-200 hover:border-cyan-400/20 hover:bg-white/[0.07] hover:shadow-[0_24px_55px_rgba(0,0,0,0.45)]"
      onClick={onClick}
    >
      {/* Card header */}
      <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-white/5 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${type.color}`}>
              {type.label}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 font-quantum text-xs text-white/60">
              {role.icon} {role.label}
            </span>
          </div>
          <span className={`rounded-full border px-2.5 py-0.5 font-quantum text-xs ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-5">
        <h3 className="mb-2 font-qdisplay text-lg font-semibold leading-snug text-white/90 line-clamp-2 group-hover:text-white">
          {project.title}
        </h3>
        <p className="mb-4 font-quantum text-sm text-white/55 line-clamp-3">{project.description}</p>

        {/* Domain */}
        {project.domain && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 rounded-lg border border-cyan-400/15 bg-cyan-500/8 px-2.5 py-1 font-quantum text-xs text-cyan-200/80">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
              </svg>
              {project.domain}
            </span>
          </div>
        )}

        {/* Meta info row */}
        <div className="flex flex-wrap gap-4 border-t border-white/5 pt-3 font-quantum text-xs text-white/40">
          {project.maturityLevel && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {project.maturityLevel}
            </span>
          )}
          {project.budgetRange && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {project.budgetRange}
            </span>
          )}
          {project.cooperationMode && (
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5 text-cyan-400/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {project.cooperationMode}
            </span>
          )}
        </div>

        {/* Required abilities */}
        {project.requiredAbilities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.requiredAbilities.slice(0, 4).map((a) => (
              <span key={a} className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/45">
                {a}
              </span>
            ))}
            {project.requiredAbilities.length > 4 && (
              <span className="rounded-md border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/30">
                +{project.requiredAbilities.length - 4}
              </span>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="mt-4 flex items-center justify-end">
          <span className="font-quantum text-xs text-cyan-400/60 transition-colors group-hover:text-cyan-300">
            查看详情 →
          </span>
        </div>
      </div>
    </div>
  );
}
