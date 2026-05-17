"use client";

import { Input } from "@/components/ui/input";

const DOMAINS = [
  "人工智能", "新材料", "新能源", "智能制造", "生物医药",
  "电子信息", "现代农业", "航空航天", "节能环保", "数字经济",
];

const ACHIEVEMENT_TYPES = [
  "专利", "软件著作权", "学术论文", "技术原型", "算法模型", "工艺方法", "设备装置",
];

const IP_STATUSES = ["已授权", "申请中", "软件著作权", "开源", "无专利"];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  domain: string;
  onDomainChange: (v: string) => void;
  achievementType: string;
  onTypeChange: (v: string) => void;
  ipStatus: string;
  onIpStatusChange: (v: string) => void;
}

const selectCls =
  "flex h-10 w-full cursor-pointer rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 font-quantum text-sm text-white/80 backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/30";

export function AchievementFilterBar({
  search, onSearchChange,
  domain, onDomainChange,
  achievementType, onTypeChange,
  ipStatus, onIpStatusChange,
}: Props) {
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
              placeholder="搜索成果名称、关键词、机构..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Domain */}
        <select value={domain} onChange={(e) => onDomainChange(e.target.value)} className={selectCls}>
          <option value="all">全部技术领域</option>
          {DOMAINS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Achievement type */}
        <select value={achievementType} onChange={(e) => onTypeChange(e.target.value)} className={selectCls}>
          <option value="all">全部成果类型</option>
          {ACHIEVEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Second row: IP status */}
      <div className="mt-3 flex flex-wrap gap-2">
        <span className="font-quantum text-xs text-white/35 self-center">知识产权：</span>
        {["all", ...IP_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => onIpStatusChange(s)}
            className={`rounded-full border px-3 py-1 font-quantum text-xs transition-all ${
              ipStatus === s
                ? "border-cyan-400/30 bg-cyan-500/15 text-cyan-200"
                : "border-white/10 bg-white/5 text-white/45 hover:text-white/70"
            }`}
          >
            {s === "all" ? "全部" : s}
          </button>
        ))}
      </div>
    </div>
  );
}
