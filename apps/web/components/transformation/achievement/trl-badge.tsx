const TRL_LABELS: Record<number, { short: string; desc: string; color: string }> = {
  1: { short: "TRL 1", desc: "基础原理观测", color: "from-slate-500 to-slate-600" },
  2: { short: "TRL 2", desc: "技术概念形成", color: "from-slate-500 to-slate-600" },
  3: { short: "TRL 3", desc: "概念验证实验", color: "from-blue-600 to-blue-700" },
  4: { short: "TRL 4", desc: "实验室验证", color: "from-blue-500 to-cyan-600" },
  5: { short: "TRL 5", desc: "相关环境验证", color: "from-cyan-500 to-teal-600" },
  6: { short: "TRL 6", desc: "相关环境演示", color: "from-teal-500 to-green-600" },
  7: { short: "TRL 7", desc: "运行环境演示", color: "from-green-500 to-emerald-600" },
  8: { short: "TRL 8", desc: "系统完整验证", color: "from-emerald-500 to-green-500" },
  9: { short: "TRL 9", desc: "实际系统验证", color: "from-green-400 to-emerald-400" },
};

interface Props {
  trlLevel: number | null;
  maturityDesc?: string | null;
  compact?: boolean;
}

export function TrlBadge({ trlLevel, maturityDesc, compact = false }: Props) {
  if (trlLevel == null) return null;
  const info = TRL_LABELS[trlLevel] ?? { short: `TRL ${trlLevel}`, desc: "", color: "from-white/20 to-white/10" };

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r px-2.5 py-0.5 font-quantum text-xs font-semibold text-white ${info.color}`}>
        {info.short}
      </span>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-quantum text-sm text-white/50">技术成熟度（TRL）</span>
        <span className={`rounded-full bg-gradient-to-r px-3 py-1 font-quantum text-sm font-bold text-white ${info.color}`}>
          {info.short} — {info.desc}
        </span>
      </div>
      {/* Progress bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className={`h-full rounded-full bg-gradient-to-r transition-all ${info.color}`}
          style={{ width: `${(trlLevel / 9) * 100}%` }}
        />
        {/* Tick marks */}
        <div className="absolute inset-0 flex items-center">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex-1 border-r border-white/15 last:border-0" />
          ))}
        </div>
      </div>
      <div className="flex justify-between font-quantum text-xs text-white/25">
        <span>基础研究</span>
        <span>商业化</span>
      </div>
      {maturityDesc && (
        <p className="font-quantum text-xs text-white/45">{maturityDesc}</p>
      )}
    </div>
  );
}
