"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TransformationProjectCard } from "@/components/transformation/browse/project-card";
import { FilterBar } from "@/components/transformation/browse/filter-bar";
import type { TransformationProject } from "@/lib/types";

// Demo data when API unavailable
const DEMO_PROJECTS: TransformationProject[] = [
  {
    id: "demo-1",
    creatorId: "school-1",
    creatorRole: "school",
    projectType: "achievement_push",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    description: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利，具有良好的产业化前景。",
    domain: "新能源",
    maturityLevel: "工程样机",
    budgetRange: null,
    cooperationMode: "技术转让",
    requiredAbilities: ["材料科学", "光电化学", "工艺工程"],
    status: "open",
    contactName: "李明华 教授",
    contactEmail: "liminghua@university.edu.cn",
    contactPhone: null,
    createdAt: "2026-03-15T08:00:00Z",
    updatedAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "demo-2",
    creatorId: "enterprise-1",
    creatorRole: "enterprise",
    projectType: "demand_pull",
    title: "面向智能制造的工业大模型推理优化方案",
    description: "企业需要一套可在边缘设备上高效运行的工业大模型推理框架，要求推理延迟 <50ms，支持私有化部署，具备工艺参数自学习能力。",
    domain: "人工智能",
    maturityLevel: null,
    budgetRange: "50-200万",
    cooperationMode: "联合开发",
    requiredAbilities: ["深度学习", "模型压缩", "边缘计算"],
    status: "open",
    contactName: "王建国 技术总监",
    contactEmail: "wangjg@smartmanu.com",
    contactPhone: null,
    createdAt: "2026-03-18T10:00:00Z",
    updatedAt: "2026-03-18T10:00:00Z",
  },
  {
    id: "demo-3",
    creatorId: "school-2",
    creatorRole: "school",
    projectType: "collaborative",
    title: "基于类器官芯片的个性化药物筛选平台",
    description: "整合微流控芯片与 AI 图像分析，实现肿瘤患者类器官的快速培养与药物敏感性高通量筛选。",
    domain: "生物医药",
    maturityLevel: "原理样机",
    budgetRange: null,
    cooperationMode: "作价入股",
    requiredAbilities: ["微流控技术", "AI 图像分析", "肿瘤学"],
    status: "open",
    contactName: "张晓燕 副教授",
    contactEmail: "zhangxy@biomed.edu.cn",
    contactPhone: null,
    createdAt: "2026-03-20T14:00:00Z",
    updatedAt: "2026-03-20T14:00:00Z",
  },
  {
    id: "demo-4",
    creatorId: "school-3",
    creatorRole: "school",
    projectType: "achievement_push",
    title: "工业级全光纤随机激光器关键技术",
    description: "实现了 1.5μm 波段高功率低噪声全光纤随机激光输出，功率稳定性 < 0.5%，可用于相干通信、传感与工业加工。",
    domain: "电子信息",
    maturityLevel: "概念验证",
    budgetRange: null,
    cooperationMode: "许可生产",
    requiredAbilities: ["光纤光学", "激光物理", "光电子封装"],
    status: "open",
    contactName: "赵志远 副研究员",
    contactEmail: "zhaozy@optech.edu.cn",
    contactPhone: null,
    createdAt: "2026-03-22T09:00:00Z",
    updatedAt: "2026-03-22T09:00:00Z",
  },
  {
    id: "demo-5",
    creatorId: "enterprise-2",
    creatorRole: "enterprise",
    projectType: "demand_pull",
    title: "复杂曲面零件的超精密加工工艺开发",
    description: "寻求高校团队联合攻关航空航天精密零件加工难题，目标实现表面粗糙度 Ra < 10nm，形位精度 ±0.5μm。",
    domain: "智能制造",
    maturityLevel: null,
    budgetRange: "200万+",
    cooperationMode: "联合开发",
    requiredAbilities: ["精密加工", "数控编程", "超精密测量"],
    status: "open",
    contactName: "陈志刚 总工程师",
    contactEmail: "chenzg@aeroind.com",
    contactPhone: null,
    createdAt: "2026-03-25T11:00:00Z",
    updatedAt: "2026-03-25T11:00:00Z",
  },
  {
    id: "demo-6",
    creatorId: "school-4",
    creatorRole: "school",
    projectType: "collaborative",
    title: "农业废弃物高效降解产氢联产有机肥系统",
    description: "开发基于嗜热菌群的秸秆类农业废弃物协同降解产氢工艺，同步产出高肥力有机肥，适合农村分布式能源站建设。",
    domain: "节能环保",
    maturityLevel: "工程样机",
    budgetRange: null,
    cooperationMode: "技术转让",
    requiredAbilities: ["生物工程", "发酵工程", "农村能源"],
    status: "open",
    contactName: "孙立群 教授",
    contactEmail: "sunlq@agrieng.edu.cn",
    contactPhone: null,
    createdAt: "2026-03-28T15:00:00Z",
    updatedAt: "2026-03-28T15:00:00Z",
  },
];

export default function BrowsePage() {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<TransformationProject[]>(DEMO_PROJECTS);
  const [filteredProjects, setFilteredProjects] = useState<TransformationProject[]>(DEMO_PROJECTS);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [projectType, setProjectType] = useState("all");
  const [total, setTotal] = useState(DEMO_PROJECTS.length);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (domain !== "all") params.domain = domain;
      if (projectType !== "all") params.project_type = projectType;
      const qs = new URLSearchParams(params).toString();
      const res = await fetch(`/api/v1/transformation/projects${qs ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setAllProjects(data.projects);
        setTotal(data.total);
      }
    } catch {
      // keep demo data
    } finally {
      setLoading(false);
    }
  }, [domain, projectType]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    let result = allProjects;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.domain.toLowerCase().includes(q)
      );
    }
    setFilteredProjects(result);
  }, [search, allProjects]);

  return (
    <div className="space-y-6">
      <div className="border-b border-white/5 pb-6">
        <h1 className="font-qdisplay text-3xl font-bold text-white/90">成果/需求广场</h1>
        <p className="mt-1 font-quantum text-sm text-white/45">
          共找到 <span className="text-cyan-300/70">{filteredProjects.length}</span> 个项目
          {total !== filteredProjects.length && `（共 ${total} 个）`}
        </p>
      </div>
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        domain={domain}
        onDomainChange={setDomain}
        projectType={projectType}
        onTypeChange={setProjectType}
      />
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
          <span className="ml-3 font-quantum text-sm text-white/50">加载中...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-16 text-center backdrop-blur-md">
          <div className="mb-4 text-5xl">🔍</div>
          <h3 className="mb-2 font-qdisplay text-xl font-semibold text-white/70">暂无符合条件的项目</h3>
          <p className="font-quantum text-sm text-white/40">试试调整筛选条件，或浏览全部项目</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => (
            <TransformationProjectCard
              key={p.id}
              project={p}
              onClick={() => router.push(`/transformation/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
