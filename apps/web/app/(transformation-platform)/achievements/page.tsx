"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AchievementCard } from "@/components/transformation/achievement/achievement-card";
import { AchievementFilterBar } from "@/components/transformation/achievement/achievement-filter";
import type { ResearchAchievement } from "@/lib/types";

// Demo fallback — mirrors achievement_service.py _DEMO
const DEMO: ResearchAchievement[] = [
  {
    id: "ach-1", creatorId: "school-1", creatorRole: "school",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    abstract: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利。",
    achievementType: "专利", domain: "新能源",
    keywords: ["钙钛矿", "太阳能电池", "印刷工艺", "低成本制备"],
    applicationScenario: "分布式光伏、建筑一体化光伏（BIPV）",
    ipStatus: "已授权", patentNumbers: ["CN202310001234.5", "CN202310005678.9"], patentType: "发明专利",
    publicationLink: "https://doi.org/10.1038/s41560-024-01234-5",
    trlLevel: 6, maturityDesc: "已完成工程样机验证，中试线建设中",
    cooperationMode: "技术转让", budgetRange: "50-200万", transformationStage: "negotiating",
    teamName: "新能源材料与器件研究团队", institutionName: "清华大学材料学院",
    contactName: "李明华 教授", contactEmail: "liminghua@university.edu.cn", contactPhone: "+86-138-0000-1234",
    requiredAbilities: ["材料科学", "光电化学", "工艺工程"], status: "active", viewCount: 128,
    createdAt: "2026-03-15T08:00:00Z", updatedAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "ach-2", creatorId: "school-2", creatorRole: "school",
    title: "基于类器官芯片的个性化药物筛选平台",
    abstract: "整合微流控芯片与 AI 图像分析，实现肿瘤患者类器官的快速培养与药物敏感性高通量筛选，筛选准确率达 87.3%。",
    achievementType: "技术原型", domain: "生物医药",
    keywords: ["类器官", "微流控芯片", "药物筛选", "精准医疗"],
    applicationScenario: "肿瘤精准用药、新药研发",
    ipStatus: "申请中", patentNumbers: ["CN202410012345.6"], patentType: "发明专利",
    publicationLink: null, trlLevel: 4, maturityDesc: "原理样机已验证，正在进行临床前研究",
    cooperationMode: "作价入股", budgetRange: "200万+", transformationStage: "published",
    teamName: "生物微系统与精准医疗实验室", institutionName: "北京大学医学部",
    contactName: "张晓燕 副教授", contactEmail: "zhangxy@biomed.edu.cn", contactPhone: null,
    requiredAbilities: ["微流控技术", "AI图像分析", "肿瘤学"], status: "active", viewCount: 95,
    createdAt: "2026-03-20T14:00:00Z", updatedAt: "2026-03-20T14:00:00Z",
  },
  {
    id: "ach-3", creatorId: "school-3", creatorRole: "school",
    title: "工业级全光纤随机激光器关键技术",
    abstract: "实现了 1.5μm 波段高功率低噪声全光纤随机激光输出，功率稳定性 < 0.5%，体积缩小 70%，成本降低 45%。",
    achievementType: "专利", domain: "电子信息",
    keywords: ["随机激光", "全光纤", "相干通信", "工业激光"],
    applicationScenario: "光纤传感、相干激光雷达、工业精密加工",
    ipStatus: "已授权", patentNumbers: ["CN202210034567.8"], patentType: "发明专利",
    publicationLink: "https://doi.org/10.1364/OL.456789",
    trlLevel: 5, maturityDesc: "实验室样机完成，正在进行工程化设计",
    cooperationMode: "许可生产", budgetRange: "10-50万", transformationStage: "published",
    teamName: "光子技术与应用研究所", institutionName: "华中科技大学",
    contactName: "赵志远 副研究员", contactEmail: "zhaozy@optech.edu.cn", contactPhone: null,
    requiredAbilities: ["光纤光学", "激光物理", "光电子封装"], status: "active", viewCount: 67,
    createdAt: "2026-03-22T09:00:00Z", updatedAt: "2026-03-22T09:00:00Z",
  },
  {
    id: "ach-4", creatorId: "school-4", creatorRole: "school",
    title: "农业废弃物高效降解产氢联产有机肥系统",
    abstract: "基于嗜热菌群的秸秆类农业废弃物协同降解产氢工艺，产氢效率较传统工艺提升 3.2 倍，有机肥氮磷钾含量提升 28%。",
    achievementType: "工艺方法", domain: "节能环保",
    keywords: ["生物产氢", "农业废弃物", "嗜热菌", "有机肥"],
    applicationScenario: "农村分布式能源站、秸秆综合利用",
    ipStatus: "已授权", patentNumbers: ["CN202310056789.0"], patentType: "发明专利",
    publicationLink: null, trlLevel: 6, maturityDesc: "工程样机已完成，正在寻求中试合作",
    cooperationMode: "技术转让", budgetRange: "10-50万", transformationStage: "published",
    teamName: "农业生物能源工程团队", institutionName: "中国农业大学",
    contactName: "孙立群 教授", contactEmail: "sunlq@agrieng.edu.cn", contactPhone: null,
    requiredAbilities: ["生物工程", "发酵工程", "农村能源"], status: "active", viewCount: 43,
    createdAt: "2026-03-28T15:00:00Z", updatedAt: "2026-03-28T15:00:00Z",
  },
  {
    id: "ach-5", creatorId: "school-5", creatorRole: "school",
    title: "面向工业互联网的轻量化联邦学习框架",
    abstract: "支持异构设备的轻量化联邦学习框架，通信开销降低 82%，模型精度损失 < 1.5%，已在 3 家制造企业完成部署验证。",
    achievementType: "软件著作权", domain: "人工智能",
    keywords: ["联邦学习", "工业互联网", "数据隐私", "边缘计算"],
    applicationScenario: "工业质检、预测性维护、供应链协同优化",
    ipStatus: "软件著作权", patentNumbers: [], patentType: null,
    publicationLink: "https://arxiv.org/abs/2403.12345",
    trlLevel: 7, maturityDesc: "已在真实工业环境完成部署验证",
    cooperationMode: "联合开发", budgetRange: "50-200万", transformationStage: "contracted",
    teamName: "智能系统与工业互联网实验室", institutionName: "上海交通大学",
    contactName: "陈浩然 研究员", contactEmail: "chenhr@sjtu.edu.cn", contactPhone: "+86-021-3420-5678",
    requiredAbilities: ["深度学习", "联邦学习", "工业自动化"], status: "active", viewCount: 156,
    createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "ach-6", creatorId: "school-6", creatorRole: "school",
    title: "高强度可降解镁合金骨科植入材料",
    abstract: "通过微合金化与表面改性技术，开发出力学性能匹配皮质骨、体内降解速率可调控的新型镁合金植入材料，已获 FDA 预申请受理。",
    achievementType: "专利", domain: "生物医药",
    keywords: ["镁合金", "可降解植入物", "骨科", "生物材料"],
    applicationScenario: "骨折内固定、脊柱融合、关节修复",
    ipStatus: "已授权", patentNumbers: ["CN202210089012.4", "US17/456789"], patentType: "发明专利",
    publicationLink: "https://doi.org/10.1016/j.biomaterials.2024.122345",
    trlLevel: 5, maturityDesc: "动物实验完成，正在推进临床试验申请",
    cooperationMode: "作价入股", budgetRange: "200万+", transformationStage: "negotiating",
    teamName: "生物医用材料与植入器械研究中心", institutionName: "西安交通大学",
    contactName: "王芳 教授", contactEmail: "wangfang@xjtu.edu.cn", contactPhone: "+86-029-8266-3456",
    requiredAbilities: ["材料科学", "生物相容性测试", "骨科临床"], status: "active", viewCount: 89,
    createdAt: "2026-04-05T09:00:00Z", updatedAt: "2026-04-05T09:00:00Z",
  },
];

export default function AchievementsPage() {
  const router = useRouter();
  const [all, setAll] = useState<ResearchAchievement[]>(DEMO);
  const [filtered, setFiltered] = useState<ResearchAchievement[]>(DEMO);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("all");
  const [achievementType, setAchievementType] = useState("all");
  const [ipStatus, setIpStatus] = useState("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (domain !== "all") qs.set("domain", domain);
      if (achievementType !== "all") qs.set("achievement_type", achievementType);
      if (ipStatus !== "all") qs.set("ip_status", ipStatus);
      const res = await fetch(`/api/v1/achievements${qs.toString() ? `?${qs}` : ""}`);
      if (res.ok) {
        const data = await res.json();
        setAll(data.achievements);
      }
    } catch {
      // keep demo data
    } finally {
      setLoading(false);
    }
  }, [domain, achievementType, ipStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!search) { setFiltered(all); return; }
    const q = search.toLowerCase();
    setFiltered(all.filter((a) =>
      a.title.toLowerCase().includes(q) ||
      a.abstract.toLowerCase().includes(q) ||
      a.keywords.some((k) => k.toLowerCase().includes(q)) ||
      a.institutionName.toLowerCase().includes(q)
    ));
  }, [search, all]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/5 pb-6">
        <div className="mb-1 flex items-center gap-2 font-quantum text-xs text-white/35">
          <a href="/transformation" className="hover:text-white/60">平台首页</a>
          <span>/</span>
          <span className="text-white/60">可转化成果库</span>
        </div>
        <h1 className="font-qdisplay text-3xl font-bold text-white/90">可转化成果库</h1>
        <p className="mt-1 font-quantum text-sm text-white/45">
          共收录 <span className="text-cyan-300/70">{filtered.length}</span> 项可转化科技成果
          {filtered.length !== all.length && `（共 ${all.length} 项）`}
        </p>
      </div>

      <AchievementFilterBar
        search={search} onSearchChange={setSearch}
        domain={domain} onDomainChange={setDomain}
        achievementType={achievementType} onTypeChange={setAchievementType}
        ipStatus={ipStatus} onIpStatusChange={setIpStatus}
      />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/30 border-t-cyan-400" />
          <span className="ml-3 font-quantum text-sm text-white/50">加载中...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-[18px] border border-white/10 bg-white/[0.04] p-16 text-center backdrop-blur-md">
          <div className="mb-4 text-5xl">🔬</div>
          <h3 className="mb-2 font-qdisplay text-xl font-semibold text-white/70">暂无符合条件的成果</h3>
          <p className="font-quantum text-sm text-white/40">试试调整筛选条件，或浏览全部成果</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AchievementCard
              key={a.id}
              achievement={a}
              onClick={() => router.push(`/transformation/achievements/${a.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
