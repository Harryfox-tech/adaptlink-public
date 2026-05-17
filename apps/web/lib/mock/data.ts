import { DashboardMetric, JobMatch, NavItem, SimulationResult } from "@/lib/types";

export const studentNav: NavItem[] = [
  { label: "学生首页", href: "/student/dashboard" },
  { label: "成长档案", href: "/student/profile" },
  { label: "成长路径模拟", href: "/student/simulators/growth" },
  { label: "求职能力模拟", href: "/student/simulators/job" },
  { label: "模拟历史", href: "/student/simulators/history" },
  { label: "岗位推荐", href: "/student/recommendations" },
  { label: "AI聊天助手", href: "/student/assistant" },
  { label: "投递中心", href: "/student/applications" },
];

export const enterpriseNav: NavItem[] = [
  { label: "企业首页", href: "/enterprise/dashboard" },
  { label: "岗位管理", href: "/enterprise/jobs" },
  { label: "人才库", href: "/enterprise/talent-pool" },
  { label: "候选人详情", href: "/enterprise/candidates/1" },
  { label: "招聘流程", href: "/enterprise/recruitment" },
  { label: "校企合作", href: "/enterprise/partnerships" },
  { label: "数据分析", href: "/enterprise/analytics" },
];

export const schoolNav: NavItem[] = [
  { label: "高校首页", href: "/school/dashboard" },
  { label: "学生发展总览", href: "/school/students" },
  { label: "学生详情", href: "/school/students/1" },
  { label: "就业数据", href: "/school/employment" },
  { label: "企业合作", href: "/school/partnerships" },
  { label: "指导干预", href: "/school/interventions" },
  { label: "平台分析", href: "/school/analytics" },
];

export const studentMetrics: DashboardMetric[] = [
  { title: "综合能力得分", value: "84.6", delta: "+3.4", hint: "最近2周提升明显" },
  { title: "模拟训练次数", value: "27", delta: "+5", hint: "成长模拟 14 / 求职模拟 13" },
  { title: "岗位匹配中位分", value: "78", delta: "+6", hint: "偏向产品运营岗" },
  { title: "本周行动项", value: "4", delta: "-1", hint: "建议完成 3 项必做训练" },
];

export const enterpriseMetrics: DashboardMetric[] = [
  { title: "本月新增岗位", value: "12", delta: "+2", hint: "技术与运营需求上升" },
  { title: "候选人入库", value: "368", delta: "+41", hint: "来自 8 所合作高校" },
  { title: "初筛通过率", value: "31%", delta: "+4%", hint: "画像筛选命中率提高" },
  { title: "在招流程中", value: "46", delta: "+8", hint: "建议增加一轮群面" },
];

export const schoolMetrics: DashboardMetric[] = [
  { title: "学生覆盖人数", value: "2,460", delta: "+126", hint: "模拟活跃率 72%" },
  { title: "就业准备达标率", value: "67%", delta: "+5%", hint: "目标在学期末达到 75%" },
  { title: "校企合作企业", value: "53", delta: "+7", hint: "新增 3 家重点实习基地" },
  { title: "高风险待干预", value: "89", delta: "-14", hint: "重点关注应届生群体" },
];

export const mockJobMatches: JobMatch[] = [
  {
    jobId: "job_001",
    title: "产品运营专员",
    company: "星澜科技",
    matchScore: 86,
    reasons: ["沟通表达能力匹配岗位协同要求", "执行与落地能力高于同届均值"],
  },
  {
    jobId: "job_002",
    title: "校园市场培训生",
    company: "映河教育",
    matchScore: 81,
    reasons: ["抗压与节奏管理能力良好", "具备较好的同理心与服务意识"],
  },
  {
    jobId: "job_003",
    title: "数据运营助理",
    company: "云策数据",
    matchScore: 77,
    reasons: ["逻辑分析能力中上", "建议加强业务指标拆解能力"],
  },
];

export const growthSimulationResult: SimulationResult = {
  sessionId: "sim_growth_20260320_001",
  simulationType: "growth",
  overallScore: 82,
  summary: "你在复杂校园协作事件中展现了高责任感与执行力，建议提升冲突沟通中的同理表达。",
  recommendations: [
    "遇到冲突时先复述对方诉求，再提出方案",
    "将周任务拆解为可执行清单，提高团队透明度",
    "每周复盘一次关键事件，沉淀个人成长日志",
  ],
  abilityScores: [
    { key: "principle", label: "原则性", score: 85, trend: "up" },
    { key: "responsibility", label: "责任感", score: 90, trend: "up" },
    { key: "empathy", label: "同理心", score: 74, trend: "flat" },
    { key: "leadership", label: "领导力", score: 78, trend: "up" },
    { key: "execution", label: "执行力", score: 88, trend: "up" },
    { key: "collaboration", label: "协作能力", score: 80, trend: "up" },
    { key: "communication", label: "沟通能力", score: 76, trend: "flat" },
    { key: "resilience", label: "抗压能力", score: 83, trend: "up" },
  ],
  agentReviews: [
    { agent: "辅导员 Agent", score: 84, summary: "规则意识强，集体目标导向明确。", highlights: ["主动担责", "对流程有敬畏"] },
    { agent: "同伴观察 Agent", score: 79, summary: "合作稳定，但冲突时表达可更柔和。", highlights: ["愿意倾听", "反馈及时"] },
    { agent: "组织考察 Agent", score: 81, summary: "在有限资源下任务推进效率高。", highlights: ["节点意识", "协调能力"] },
    { agent: "职业发展导师 Agent", score: 84, summary: "具备成长潜力，建议补强高压沟通。", highlights: ["复盘习惯", "学习意愿"] },
  ],
};

export const jobSimulationResult: SimulationResult = {
  sessionId: "sim_job_20260320_001",
  simulationType: "job",
  overallScore: 79,
  summary: "你的岗位理解与协作意识较好，在压力追问环节需要更结构化的表达。",
  recommendations: [
    "使用 STAR 框架回答行为问题",
    "给出量化指标，增强结果说服力",
    "针对目标岗位补齐业务分析案例",
  ],
  abilityScores: [
    { key: "communication", label: "沟通表达能力", score: 78, trend: "up" },
    { key: "logic", label: "逻辑分析能力", score: 75, trend: "flat" },
    { key: "job_understanding", label: "岗位理解能力", score: 84, trend: "up" },
    { key: "execution", label: "执行与落地能力", score: 80, trend: "up" },
    { key: "teamwork", label: "团队协作能力", score: 82, trend: "up" },
    { key: "resilience", label: "抗压能力", score: 73, trend: "flat" },
    { key: "learning", label: "学习潜力", score: 81, trend: "up" },
    { key: "fit", label: "岗位匹配度", score: 79, trend: "up" },
  ],
  agentReviews: [
    { agent: "HR 面试官 Agent", score: 80, summary: "动机清晰，稳定性良好。", highlights: ["表达自然", "自我认知较清楚"] },
    { agent: "业务面试官 Agent", score: 77, summary: "问题拆解能力不错，案例深度可增强。", highlights: ["思路清楚", "业务术语准确"] },
    { agent: "团队主管 Agent", score: 78, summary: "协作意愿高，抗压问答略保守。", highlights: ["配合意识", "节奏控制"] },
    { agent: "职业顾问 Agent", score: 81, summary: "适合运营与项目协同岗位，建议强化数据复盘。", highlights: ["成长潜力", "方向匹配"] },
  ],
  jobMatches: mockJobMatches,
};
