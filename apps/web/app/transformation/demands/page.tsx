"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DemandCard } from "@/components/transformation/demand/demand-card";
import { DemandFilterBar } from "@/components/transformation/demand/demand-filter";
import type { EnterpriseDemand } from "@/lib/types";

// Demo fallback data — mirrors what the backend demand_service.py will serve
const DEMO_DEMANDS: EnterpriseDemand[] = [
  {
    id: "dem-1", creatorId: "enterprise-1", creatorRole: "enterprise",
    title: "面向智能制造的工业大模型推理优化方案",
    description: "企业需要一套可在边缘设备上高效运行的工业大模型推理框架，要求推理延迟 <50ms，支持私有化部署，具备工艺参数自学习能力。",
    domain: "人工智能", cooperationMode: "联合开发", budgetRange: "50-200万", urgencyLevel: "中期",
    technicalRequirements: "支持私有化部署的轻量化大模型，边缘推理延迟 <50ms，支持行业知识注入",
    requiredAbilities: ["深度学习", "模型压缩", "边缘计算", "工业自动化"],
    targetTrl: 5,
    enterpriseName: "某头部制造集团", enterpriseScale: "大型", industrySector: "智能制造",
    verificationTasks: ["模型压缩方案对比验证", "边缘部署性能测试"],
    achievementAttribution: null,
    contactName: "王建国 技术总监", contactEmail: "tech@smartmanu.com", contactPhone: null,
    status: "active", matchCount: 2, createdAt: "2026-03-18T10:00:00Z", updatedAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "dem-2", creatorId: "enterprise-2", creatorRole: "enterprise",
    title: "高性能钠离子电池正极材料开发",
    description: "寻求与高校团队合作开发低成本、高循环稳定性的钠离子电池正极材料，目标能量密度 ≥ 140Wh/kg，循环寿命 ≥ 3000 次。",
    domain: "新能源", cooperationMode: "技术入股", budgetRange: "200万+", urgencyLevel: "长期",
    technicalRequirements: "钠离子电池正极材料，140Wh/kg+，3000次循环",
    requiredAbilities: ["电化学", "材料科学", "电池工艺"],
    targetTrl: 4,
    enterpriseName: "某能源科技公司", enterpriseScale: "中型", industrySector: "新能源",
    verificationTasks: ["材料制备工艺优化", "扣电性能测试验证"],
    achievementAttribution: "联合开发成果双方共有",
    contactName: "李博士 研发总监", contactEmail: "rd@battech.com", contactPhone: "+86-021-1234-5678",
    status: "active", matchCount: 1, createdAt: "2026-03-22T14:00:00Z", updatedAt: "2026-03-22T14:00:00Z",
  },
  {
    id: "dem-3", creatorId: "enterprise-3", creatorRole: "enterprise",
    title: "工业机器人视觉引导系统国产化",
    description: "寻求高校合作开发国产化工业机器人 3D 视觉引导系统，替代进口方案，成本降低 40% 以上，适用于上下料、装配等场景。",
    domain: "智能制造", cooperationMode: "联合开发", budgetRange: "50-200万", urgencyLevel: "短期",
    technicalRequirements: "3D视觉引导系统，精度 ±0.5mm，适用多种工件",
    requiredAbilities: ["计算机视觉", "机器人控制", "嵌入式系统", "点云处理"],
    targetTrl: 5,
    enterpriseName: "某装备制造企业", enterpriseScale: "中型", industrySector: "装备制造",
    verificationTasks: ["视觉算法精度验证", "多工件适配测试"],
    achievementAttribution: "企业享有优先使用权",
    contactName: "张工 项目经理", contactEmail: "pm@robotequip.cn", contactPhone: null,
    status: "active", matchCount: 3, createdAt: "2026-03-25T09:00:00Z", updatedAt: "2026-03-25T09:00:00Z",
  },
  {
    id: "dem-4", creatorId: "enterprise-4", creatorRole: "enterprise",
    title: "基于合成生物学的医用活性原料规模化生产",
    description: "企业寻求具备合成生物学与代谢工程背景的高校团队合作，开发医用活性原料的绿色生物制造工艺，目标收率提升 3 倍以上。",
    domain: "生物医药", cooperationMode: "技术入股", budgetRange: "200万+", urgencyLevel: "中期",
    technicalRequirements: "合成生物学工艺，收率提升3倍，符合GMP标准",
    requiredAbilities: ["合成生物学", "代谢工程", "发酵工艺", "GMP生产"],
    targetTrl: 4,
    enterpriseName: "某生物医药集团", enterpriseScale: "大型", industrySector: "生物医药",
    verificationTasks: ["菌株构建与筛选", "小试发酵工艺验证"],
    achievementAttribution: null,
    contactName: "陈博士 首席科学家", contactEmail: "cs@biopharma.com", contactPhone: null,
    status: "active", matchCount: 1, createdAt: "2026-03-28T11:00:00Z", updatedAt: "2026-03-28T11:00:00Z",
  },
  {
    id: "dem-5", creatorId: "enterprise-5", creatorRole: "enterprise",
    title: "碳中和园区综合能源管理系统开发",
    description: "面向工业园区开发碳排放监测与综合能源优化管理系统，支持多能互补协调优化，碳核算精度 ≥ 95%，节碳率 ≥ 15%。",
    domain: "节能环保", cooperationMode: "联合开发", budgetRange: "50-200万", urgencyLevel: "中期",
    technicalRequirements: "碳排放实时监测，多能互补优化，精度≥95%，节碳率≥15%",
    requiredAbilities: ["能源工程", "碳核算", "AI优化算法", "物联网"],
    targetTrl: 6,
    enterpriseName: "某环保科技集团", enterpriseScale: "中型", industrySector: "节能环保",
    verificationTasks: ["碳核算模型精度测试", "多能互补策略验证"],
    achievementAttribution: "双方共有，优先许可给企业",
    contactName: "刘总 副总裁", contactEmail: "liuzu@greentech.cn", contactPhone: null,
    status: "active", matchCount: 2, createdAt: "2026-04-02T15:00:00Z", updatedAt: "2026-04-02T15:00:00Z",
  },
];

export default function DemandsPage() {
  const router = useRouter();
  const [all, setAll] = useState<EnterpriseDemand[]>(DEMO_DEMANDS);
  const [filtered, setFiltered] = useState<EnterpriseDemand[]>(DEMO_DEMANDS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [cooperationMode, setCooperationMode] = useState("all");
  const [budgetRange, setBudgetRange] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (search) qs.set("keyword", search);
      if (domain !== "all") qs.set("domain", domain);
      if (cooperationMode !== "all") qs.set("cooperation_mode", cooperationMode);
      if (budgetRange !== "all") qs.set("budget_range", budgetRange);
      const res = await fetch(`/api/v1/demands${qs.toString() ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setAll(data.demands);
      }
    } catch {
      // keep demo data on network error
    } finally {
      setLoading(false);
    }
  }, [search, domain, cooperationMode, budgetRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Local client-side filter for sub-filtering when search changes rapidly
  // (also handles case where API doesn't yet support keyword)
  useEffect(() => {
    if (!search) { setFiltered(all); return; }
    const q = search.toLowerCase();
    setFiltered(all.filter((d) =>
      d.title.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.requiredAbilities.some((a) => a.toLowerCase().includes(q)) ||
      d.enterpriseName.toLowerCase().includes(q) ||
      d.domain.toLowerCase().includes(q)
    ));
  }, [search, all]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="mb-1 flex items-center gap-2 font-quantum text-xs text-white/35">
          <a href="/transformation" className="hover:text-white/60">平台首页</a>
          <span>/</span>
          <span className="text-white/60">企业技术需求广场</span>
        </div>
        <h1 className="font-qdisplay text-3xl font-bold text-white/90">企业技术需求广场</h1>
        <p className="mt-1 font-quantum text-sm text-white/45">
          共收录 <span className="text-orange-300/70">{filtered.length}</span> 项企业真实技术需求
          {filtered.length !== all.length && `（共 ${all.length} 项）`}，可发布验证任务邀请学生参与
        </p>
      </div>

      <DemandFilterBar
        search={search} onSearchChange={setSearch}
        domain={domain} onDomainChange={setDomain}
        cooperationMode={cooperationMode} onCooperationModeChange={setCooperationMode}
        budgetRange={budgetRange} onBudgetRangeChange={setBudgetRange}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-400/30 border-t-orange-400" />
          <span className="ml-3 font-quantum text-sm text-white/50">加载中...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-16 text-center backdrop-blur-md">
          <div className="mb-4 text-5xl">🏢</div>
          <h3 className="mb-2 font-qdisplay text-xl font-semibold text-white/70">暂无符合条件的需求</h3>
          <p className="font-quantum text-sm text-white/40">试试调整筛选条件，或浏览全部需求</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <DemandCard
              key={d.id}
              demand={d}
              onClick={() => router.push(`/transformation/demands/${d.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
