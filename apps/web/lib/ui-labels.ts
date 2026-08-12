export const simulationTypeLabel: Record<"growth" | "job", string> = {
  growth: "成长模拟",
  job: "求职模拟",
};

export const episodeStatusLabel: Record<string, string> = {
  active: "进行中",
  completed: "已完成",
  paused: "已暂停",
  pending: "待开始",
};

export const riskLevelLabel: Record<string, string> = {
  high: "高风险",
  medium: "中风险",
  low: "低风险",
};

export const trendLabel: Record<string, string> = {
  up: "上升",
  down: "下降",
  flat: "持平",
};

export const chatStatusLabel: Record<string, string> = {
  ready: "就绪",
  submitted: "已提交",
  streaming: "生成中",
  error: "出错",
};

export const engineLabel: Record<string, string> = {
  openai: "OpenAI",
  mock: "本地模拟",
  deepseek: "DeepSeek",
};

export function labelSimulationType(type: string) {
  return simulationTypeLabel[type as keyof typeof simulationTypeLabel] ?? type;
}

export function labelEpisodeStatus(status: string) {
  return episodeStatusLabel[status] ?? status;
}

export function labelRiskLevel(level: string) {
  return riskLevelLabel[level] ?? level;
}

export function labelTrend(trend: string) {
  return trendLabel[trend] ?? trend;
}

export function labelChatStatus(status: string) {
  return chatStatusLabel[status] ?? status;
}

export function labelEngine(engine: string) {
  return engineLabel[engine.toLowerCase()] ?? engine;
}

export function riskBadgeClass(level: string) {
  if (level === "high") return "border border-rose-400/25 bg-rose-500/10 text-rose-200";
  if (level === "medium") return "border border-amber-400/25 bg-amber-500/10 text-amber-200";
  return "border border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
}

export const strengthBadgeClass = "border border-emerald-400/25 bg-emerald-500/10 text-emerald-200";
export const warnBadgeClass = "border border-amber-400/25 bg-amber-500/10 text-amber-200";
export const infoBadgeClass = "border border-cyan-400/25 bg-cyan-500/10 text-cyan-200";
export const filterBadgeClass = "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10";
export const filterSkyBadgeClass = "border border-sky-400/25 bg-sky-500/10 text-sky-200 hover:bg-sky-500/15";
