"use client";

import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  domain: string;
  onDomainChange: (v: string) => void;
  projectType: string;
  onTypeChange: (v: string) => void;
}

const DOMAINS = [
  "人工智能", "新材料", "新能源", "智能制造", "生物医药",
  "电子信息", "现代农业", "航空航天", "节能环保", "数字经济",
];

const TYPES = [
  { value: "all", label: "全部类型" },
  { value: "achievement_push", label: "成果供给" },
  { value: "demand_pull", label: "需求发布" },
  { value: "collaborative", label: "合作机会" },
];

export function FilterBar({ search, onSearchChange, domain, onDomainChange, projectType, onTypeChange }: Props) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        {/* Search */}
        <div className="md:col-span-2">
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="搜索成果名称、技术领域..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Domain */}
        <div>
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="flex h-10 w-full cursor-pointer rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 font-quantum text-sm text-white/80 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
          >
            <option value="all">全部技术领域</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <select
            value={projectType}
            onChange={(e) => onTypeChange(e.target.value)}
            className="flex h-10 w-full cursor-pointer rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 font-quantum text-sm text-white/80 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
