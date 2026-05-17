"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/neo/glass-card";
import { AchievementCard } from "@/components/transformation/achievement/achievement-card";
import type { ResearchAchievement, EnterpriseDemand } from "@/lib/types";

const DEMO_ACHIEVEMENTS: ResearchAchievement[] = [
  {
    id: "ach-1", creatorId: "school-1", creatorRole: "school",
    title: "高效钙钛矿太阳能电池低成本制备技术",
    abstract: "团队研发的新型印刷工艺可将钙钛矿电池制备成本降低 60%，组件效率突破 24.3%，已获 3 项发明专利。",
    achievementType: "专利", domain: "新能源",
    keywords: ["钙钛矿", "太阳能电池", "印刷工艺"],
    applicationScenario: "分布式光伏、建筑一体化光伏（BIPV）",
    ipStatus: "已授权", patentNumbers: ["CN202310001234.5"], patentType: "发明专利",
    publicationLink: null, trlLevel: 6, maturityDesc: "已完成工程样机验证",
    cooperationMode: "技术转让", budgetRange: "50-200万", transformationStage: "negotiating",
    teamName: "新能源材料与器件研究团队", institutionName: "清华大学材料学院",
    contactName: "李明华 教授", contactEmail: "liminghua@tsinghua.edu.cn", contactPhone: null,
    requiredAbilities: ["材料科学", "光电化学", "工艺工程"],
    status: "active", viewCount: 128, createdAt: "2026-03-15T08:00:00Z", updatedAt: "2026-03-15T08:00:00Z",
  },
  {
    id: "ach-5", creatorId: "school-5", creatorRole: "school",
    title: "面向工业互联网的轻量化联邦学习框架",
    abstract: "支持异构设备的轻量化联邦学习框架，通信开销降低 82%，已在 3 家制造企业完成部署验证。",
    achievementType: "软件著作权", domain: "人工智能",
    keywords: ["联邦学习", "工业互联网", "边缘计算"],
    applicationScenario: "工业质检、预测性维护",
    ipStatus: "软件著作权", patentNumbers: [], patentType: null,
    publicationLink: "https://arxiv.org/abs/2403.12345",
    trlLevel: 7, maturityDesc: "已在真实工业环境完成部署验证",
    cooperationMode: "联合开发", budgetRange: "50-200万", transformationStage: "contracted",
    teamName: "智能系统与工业互联网实验室", institutionName: "上海交通大学",
    contactName: "陈浩然 研究员", contactEmail: "chenhr@sjtu.edu.cn", contactPhone: null,
    requiredAbilities: ["深度学习", "联邦学习", "工业自动化"],
    status: "active", viewCount: 156, createdAt: "2026-04-01T10:00:00Z", updatedAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "ach-2", creatorId: "school-2", creatorRole: "school",
    title: "基于类器官芯片的个性化药物筛选平台",
    abstract: "整合微流控芯片与 AI 图像分析，实现肿瘤患者类器官的快速培养与药物敏感性高通量筛选。",
    achievementType: "技术原型", domain: "生物医药",
    keywords: ["类器官", "微流控芯片", "药物筛选"],
    applicationScenario: "肿瘤精准用药、新药研发",
    ipStatus: "申请中", patentNumbers: ["CN202410012345.6"], patentType: "发明专利",
    publicationLink: null, trlLevel: 4, maturityDesc: "原理样机已验证",
    cooperationMode: "作价入股", budgetRange: "200万+", transformationStage: "published",
    teamName: "生物微系统与精准医疗实验室", institutionName: "北京大学医学部",
    contactName: "张晓燕 副教授", contactEmail: "zhangxy@bjmu.edu.cn", contactPhone: null,
    requiredAbilities: ["微流控技术", "AI图像分析", "肿瘤学"],
    status: "active", viewCount: 95, createdAt: "2026-03-20T14:00:00Z", updatedAt: "2026-03-20T14:00:00Z",
  },
];

// ── Demo data — demands (replaced by live fetch below)
const DEMO_DEMANDS = [
  { id: "dem-1", title: "面向智能制造的工业大模型推理优化方案", domain: "人工智能", budgetRange: "50-200万", cooperationMode: "联合开发", requiredAbilities: ["深度学习", "模型压缩", "边缘计算"], enterpriseName: "某头部制造集团" },
  { id: "dem-2", title: "高性能钠离子电池正极材料开发", domain: "新能源", budgetRange: "200万+", cooperationMode: "技术入股", requiredAbilities: ["电化学", "材料科学", "电池工艺"], enterpriseName: "某能源科技公司" },
  { id: "dem-3", title: "工业机器人视觉引导系统国产化", domain: "智能制造", budgetRange: "50-200万", cooperationMode: "联合开发", requiredAbilities: ["计算机视觉", "机器人控制", "嵌入式系统"], enterpriseName: "某装备制造企业" },
];
const CHAIN_NODES = [
  { key: "supply", label: "成果供给", desc: "高校科研团队发布可转化成果，展示技术成熟度与专利情况", icon: "🎓", color: "from-cyan-600/20 to-blue-600/15 border-cyan-400/20", accent: "text-cyan-300" },
  { key: "demand", label: "需求牵引", desc: "企业/政府园区发布真实技术需求，倒逼成果转化方向", icon: "🏢", color: "from-orange-600/20 to-red-600/15 border-orange-400/20", accent: "text-orange-300" },
  { key: "project", label: "项目撮合", desc: "平台基于 TAI/LSM 智能匹配，生成结构化合作方案建议", icon: "🔗", color: "from-blue-600/20 to-purple-600/15 border-blue-400/20", accent: "text-blue-300" },
  { key: "talent", label: "人才参与", desc: "学生深度参与技术验证与转化协同，成长为复合型转化人才", icon: "👥", color: "from-green-600/20 to-emerald-600/15 border-green-400/20", accent: "text-green-300" },
  { key: "governance", label: "治理支撑", desc: "政府园区掌握全局数据，精准投放政策激励，保障转化落地", icon: "🏛️", color: "from-purple-600/20 to-fuchsia-600/15 border-purple-400/20", accent: "text-purple-300" },
];

const STATS_ITEMS = [
  { label: "收录成果", value: "—", icon: "🎓", unit: "项", color: "text-cyan-300" },
  { label: "发布需求", value: "—", icon: "🏢", unit: "项", color: "text-orange-300" },
  { label: "进行中项目", value: "—", icon: "🔗", unit: "项", color: "text-blue-300" },
  { label: "参与学生", value: "—", icon: "👥", unit: "人", color: "text-green-300" },
];

export default function TransformationHubPage() {
  const router = useRouter();
  const [achievements, setAchievements] = useState<ResearchAchievement[]>(DEMO_ACHIEVEMENTS);
  const [demands, setDemands] = useState<EnterpriseDemand[]>(DEMO_DEMANDS as EnterpriseDemand[]);
  const [stats, setStats] = useState({ achievements: "—", demands: "—", projects: "—", students: "—" });

  useEffect(() => {
    fetch("/api/v1/achievements")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.achievements) {
          setAchievements(d.achievements.slice(0, 3));
          setStats((s) => ({ ...s, achievements: String(d.achievements.length) }));
        }
      })
      .catch(() => {});
    fetch("/api/v1/demands")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d?.demands) {
          setDemands(d.demands.slice(0, 3));
          setStats((s) => ({ ...s, demands: String(d.demands.length) }));
        }
      })
      .catch(() => {});
    fetch("/api/v1/transformation/stats")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (d) setStats((s) => ({
          ...s,
          projects: String(d.open_projects ?? "—"),
        }));
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-16">

      {/* ── Hero ── */}
      <section className="py-12 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-4 py-1.5 font-quantum text-xs text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            五方协同 · 全链路转化
          </div>
          <h1 className="mb-4 font-qdisplay text-5xl font-bold leading-tight text-white md:text-[3.5rem]">
            科技成果转化
            <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-fuchsia-300 bg-clip-text text-transparent">
              {" "}智能协同平台
            </span>
          </h1>
          <p className="mb-8 font-quantum text-lg text-white/55">
            高校 · 企业 · 政府园区 · 学生 · 平台五方协同，基于 TAI 能力评估与 LSM 路径仿真，
            <br className="hidden md:block" />构建从「实验室成果」到「生产线落地」的完整转化链路
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="/transformation/achievements">
              <button className="rounded-[14px] border border-cyan-300/15 bg-cyan-500/20 px-8 py-3 font-quantum text-base font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.18)] transition-all hover:bg-cyan-500/30 hover:shadow-[0_0_32px_rgba(34,211,238,0.28)]">
                成果库
              </button>
            </a>
            <a href="/transformation/demands">
              <button className="rounded-[14px] border border-orange-300/15 bg-orange-500/20 px-8 py-3 font-quantum text-base font-semibold text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.18)] transition-all hover:bg-orange-500/30">
                需求广场
              </button>
            </a>
            <a href="/register">
              <button className="rounded-[14px] border border-white/10 bg-white/5 px-8 py-3 font-quantum text-base font-semibold text-white/80 transition-all hover:bg-white/10 hover:text-white">
                立即入驻
              </button>
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { ...STATS_ITEMS[0], value: stats.achievements },
          { ...STATS_ITEMS[1], value: stats.demands },
          { ...STATS_ITEMS[2], value: stats.projects },
          { ...STATS_ITEMS[3], value: stats.students },
        ].map((s) => (
          <GlassCard key={s.label} className="p-5 text-center">
            <div className="mb-2 text-3xl">{s.icon}</div>
            <div className="font-qdisplay text-3xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="mt-1 font-quantum text-xs text-white/40">{s.label}</div>
          </GlassCard>
        ))}
      </section>

      {/* ── 5-Chain Mechanism ── */}
      <section>
        <div className="mb-2 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-1 font-quantum text-xs text-fuchsia-300">
            核心机制
          </div>
        </div>
        <h2 className="mb-2 text-center font-qdisplay text-2xl font-bold text-white/90">
          成果转化协同链路
        </h2>
        <p className="mb-8 text-center font-quantum text-sm text-white/40">
          五大环节双向驱动，可从成果侧或需求侧任意节点进入
        </p>

        <div className="relative">
          {/* Bidirectional arrows hint */}
          <div className="mb-6 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-cyan-400/15 bg-cyan-500/8 px-4 py-1.5 font-quantum text-xs text-cyan-300">
              <span>⬇</span> 成果驱动路径
            </div>
            <div className="h-px w-12 bg-white/10" />
            <div className="flex items-center gap-2 rounded-full border border-orange-400/15 bg-orange-500/8 px-4 py-1.5 font-quantum text-xs text-orange-300">
              <span>⬆</span> 需求拉动路径
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            {CHAIN_NODES.map((node, idx) => (
              <GlassCard key={node.key} className={`relative overflow-hidden bg-gradient-to-br p-5 ${node.color}`}>
                {/* Step number */}
                <div className="absolute right-3 top-3 font-qdisplay text-5xl font-bold text-white/8">
                  0{idx + 1}
                </div>
                <div className="mb-3 text-3xl">{node.icon}</div>
                <h3 className="mb-2 font-qdisplay text-base font-semibold text-white/90">{node.label}</h3>
                <p className="font-quantum text-xs leading-relaxed text-white/50">{node.desc}</p>
                {/* Arrow between nodes */}
                {idx < CHAIN_NODES.length - 1 && (
                  <div className="absolute -right-4 top-1/2 z-10 hidden md:flex -translate-y-1/2 items-center">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-slate-900/80 backdrop-blur-md">
                      <span className="font-quantum text-xs text-white/50">⟷</span>
                    </div>
                  </div>
                )}
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4-Role Cards ── */}
      <section>
        <h2 className="mb-6 font-qdisplay text-2xl font-bold text-white/90">五方协同，共建转化生态</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
          {/* 高校 */}
          <GlassCard className="bg-gradient-to-br from-cyan-600/20 to-blue-600/15 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">🎓</span>
              <div>
                <h3 className="font-qdisplay text-base font-bold text-white/90">高校</h3>
                <p className="font-quantum text-xs text-white/45">成果持有方</p>
              </div>
            </div>
            <ul className="mb-5 space-y-2">
              {["发布待转化科技成果", "展示技术成熟度（TRL）", "对接企业投资方", "获得 LSM 路径建议"].map((f) => (
                <li key={f} className="flex items-start gap-2 font-quantum text-xs text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400/60" />
                  {f}
                </li>
              ))}
            </ul>
            <a href="/school/transformation/publish">
              <button className="w-full rounded-[12px] border border-cyan-400/20 bg-cyan-500/15 py-2.5 font-quantum text-sm text-cyan-200 transition-all hover:bg-cyan-500/25">
                发布成果 →
              </button>
            </a>
          </GlassCard>

          {/* 企业 */}
          <GlassCard className="bg-gradient-to-br from-orange-600/20 to-red-600/15 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">🏢</span>
              <div>
                <h3 className="font-qdisplay text-base font-bold text-white/90">企业</h3>
                <p className="font-quantum text-xs text-white/45">需求合作方</p>
              </div>
            </div>
            <ul className="mb-5 space-y-2">
              {["发布真实技术合作需求", "浏览高校科技成果库", "发布技术验证任务", "跟踪对接转化进度"].map((f) => (
                <li key={f} className="flex items-start gap-2 font-quantum text-xs text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-orange-400/60" />
                  {f}
                </li>
              ))}
            </ul>
            <a href="/enterprise/transformation/post">
              <button className="w-full rounded-[12px] border border-orange-400/20 bg-orange-500/15 py-2.5 font-quantum text-sm text-orange-200 transition-all hover:bg-orange-500/25">
                发布需求 →
              </button>
            </a>
          </GlassCard>

          {/* 政府园区 */}
          <GlassCard className="bg-gradient-to-br from-purple-600/20 to-fuchsia-600/15 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">🏛️</span>
              <div>
                <h3 className="font-qdisplay text-base font-bold text-white/90">政府园区</h3>
                <p className="font-quantum text-xs text-white/45">治理支撑方</p>
              </div>
            </div>
            <ul className="mb-5 space-y-2">
              {["掌握区域转化全景数据", "TRL 分布与堵点诊断", "精准投放政策激励", "治理报告一键导出"].map((f) => (
                <li key={f} className="flex items-start gap-2 font-quantum text-xs text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400/60" />
                  {f}
                </li>
              ))}
            </ul>
            <a href="/school/park">
              <button className="w-full rounded-[12px] border border-purple-400/20 bg-purple-500/15 py-2.5 font-quantum text-sm text-purple-200 transition-all hover:bg-purple-500/25">
                治理视图 →
              </button>
            </a>
          </GlassCard>

          {/* 学生 */}
          <GlassCard className="bg-gradient-to-br from-green-600/20 to-emerald-600/15 p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="text-4xl">👥</span>
              <div>
                <h3 className="font-qdisplay text-base font-bold text-white/90">学生</h3>
                <p className="font-quantum text-xs text-white/45">技术验证与转化人才</p>
              </div>
            </div>
            <ul className="mb-5 space-y-2">
              {["参与成果技术验证任务", "加入协同转化项目", "TAI 能力成长追踪", "LSM 路径规划与复盘"].map((f) => (
                <li key={f} className="flex items-start gap-2 font-quantum text-xs text-white/60">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-green-400/60" />
                  {f}
                </li>
              ))}
            </ul>
            <a href="/student/transformation">
              <button className="w-full rounded-[12px] border border-green-400/20 bg-green-500/15 py-2.5 font-quantum text-sm text-green-200 transition-all hover:bg-green-500/25">
                转化工作台 →
              </button>
            </a>
          </GlassCard>
        </div>
      </section>

      {/* ── Featured Achievements ── */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-qdisplay text-2xl font-bold text-white/90">🔥 热门可转化成果</h2>
          <a href="/transformation/achievements" className="font-quantum text-sm text-cyan-400/70 transition-colors hover:text-cyan-300">
            进入成果库 →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {achievements.map((a) => (
            <AchievementCard
              key={a.id}
              achievement={a}
              onClick={() => router.push(`/transformation/achievements/${a.id}`)}
            />
          ))}
        </div>
      </section>

      {/* ── Featured Demands ── */}
      <section>
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-qdisplay text-2xl font-bold text-white/90">🏢 企业技术需求</h2>
          <a href="/transformation/demands" className="font-quantum text-sm text-orange-400/70 transition-colors hover:text-orange-300">
            进入需求广场 →
          </a>
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3" id="featured-demands">
          {demands.map((d) => (
            <GlassCard key={d.id} className="cursor-pointer p-5 transition hover:-translate-y-1 hover:border-orange-400/30" onClick={() => router.push(`/transformation/demands/${d.id}`)}>
              <div className="mb-3 flex flex-wrap gap-2">
                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-3 py-1 font-quantum text-xs text-orange-200">
                  {d.domain}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-quantum text-xs text-white/50">
                  💰 {d.budgetRange ?? "待定"}
                </span>
              </div>
              <h3 className="mb-3 font-qdisplay text-base font-semibold leading-snug text-white/90">
                {d.title}
              </h3>
              <div className="mb-3 flex flex-wrap gap-1.5">
                {(d.requiredAbilities ?? []).slice(0, 3).map((a) => (
                  <span key={a} className="rounded-[8px] border border-white/8 bg-white/5 px-2 py-0.5 font-quantum text-xs text-white/45">
                    {a}
                  </span>
                ))}
              </div>
              <div className="border-t border-white/5 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-quantum text-xs text-white/40">🏢 {d.enterpriseName}</span>
                  <span className="font-quantum text-xs text-white/30">{d.cooperationMode}</span>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* ── TAI × LSM Banner ── */}
      <GlassCard className="bg-gradient-to-r from-cyan-900/20 to-blue-900/20 p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1 font-quantum text-xs text-cyan-300">
              🔬 智能内核
            </div>
            <h3 className="mb-3 font-qdisplay text-2xl font-bold text-white/90">
              TAI 能力评估 × LSM 路径仿真
            </h3>
            <p className="font-quantum text-sm leading-relaxed text-white/55">
              平台内置 TAI 能力维度评估体系，可对学生与团队的核心转化能力进行量化分析；
              LSM 仿真引擎模拟真实转化路径，提前识别风险节点，生成结构化转化方案建议。
            </p>
          </div>
          <div className="space-y-3">
            {[
              { label: "能力维度量化", desc: "8 大核心能力维度，量化成果转化竞争力", color: "text-cyan-300" },
              { label: "路径仿真推演", desc: "多阶段仿真，模拟政策/市场/技术三重不确定性", color: "text-blue-300" },
              { label: "智能推荐匹配", desc: "基于能力标签与项目需求，精准推荐合作候选方", color: "text-fuchsia-300" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-[12px] border border-white/8 bg-white/5 p-3">
                <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${item.color.replace('text-', 'bg-')}`} />
                <div>
                  <p className="font-qdisplay text-sm font-semibold text-white/80">{item.label}</p>
                  <p className="font-quantum text-xs text-white/45">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </GlassCard>

    </div>
  );
}
