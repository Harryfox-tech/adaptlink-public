"use client";

import { Input } from "@/components/ui/input";

const DOMAINS = ["全部领域", "人工智能", "新材料", "新能源", "智能制造", "生物医药", "电子信息", "现代农业", "航空航天", "节能环保", "数字经济"];

const COOPERATION_MODES = ["全部模式", "联合开发", "技术入股", "技术转让", "许可生产"];

const BUDGET_RANGES = ["全部预算", "10万以下", "10-50万", "50-200万", "200万+"];

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  domain: string;
  onDomainChange: (v: string) => void;
  cooperationMode: string;
  onCooperationModeChange: (v: string) => void;
  budgetRange: string;
  onBudgetRangeChange: (v: string) => void;
}

export function DemandFilterBar({
  search, onSearchChange,
  domain, onDomainChange,
  cooperationMode, onCooperationModeChange,
  budgetRange, onBudgetRangeChange,
}: Props) {
  return (
    <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-md">
      {/* Search row */}
      <div className="mb-3">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索需求名称、技术领域、企业..."
          className="h-11 rounded-[12px] border border-white/10 bg-white/5 px-4 font-quantum text-sm text-white/80 placeholder:text-white/25 focus-visible:ring-2 focus-visible:ring-orange-300/30"
        />
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {/* Domain */}
        <select
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          className="h-9 cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3 font-quantum text-xs text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/30"
        >
          {DOMAINS.map((d) => <option key={d} value={d === "全部领域" ? "all" : d}>{d}</option>)}
        </select>

        {/* Cooperation mode */}
        <select
          value={cooperationMode}
          onChange={(e) => onCooperationModeChange(e.target.value)}
          className="h-9 cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3 font-quantum text-xs text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/30"
        >
          {COOPERATION_MODES.map((m) => <option key={m} value={m === "全部模式" ? "all" : m}>{m}</option>)}
        </select>

        {/* Budget range */}
        <select
          value={budgetRange}
          onChange={(e) => onBudgetRangeChange(e.target.value)}
          className="h-9 cursor-pointer rounded-[10px] border border-white/10 bg-white/5 px-3 font-quantum text-xs text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300/30"
        >
          {BUDGET_RANGES.map((b) => <option key={b} value={b === "全部预算" ? "all" : b}>{b}</option>)}
        </select>
      </div>
    </div>
  );
}
