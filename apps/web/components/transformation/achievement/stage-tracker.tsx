const STAGES = [
  { key: "published", label: "发布中", desc: "成果已发布，等待企业浏览" },
  { key: "negotiating", label: "洽谈中", desc: "已有企业接触，正在商务洽谈" },
  { key: "contracted", label: "已签约", desc: "转化协议已签署" },
  { key: "deployed", label: "落地中", desc: "技术转移/中试进行中" },
  { key: "completed", label: "已完成", desc: "成果转化落地验收完成" },
];

interface Props {
  currentStage: string;
}

export function StageTracker({ currentStage }: Props) {
  const currentIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="space-y-2">
      {STAGES.map((stage, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        return (
          <div key={stage.key} className="flex items-start gap-3">
            {/* Indicator */}
            <div className="flex flex-col items-center">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                done
                  ? "bg-green-500/20 text-green-300"
                  : active
                  ? "bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-400/30"
                  : "border border-white/15 bg-white/5 text-white/25"
              }`}>
                {done ? "✓" : idx + 1}
              </div>
              {idx < STAGES.length - 1 && (
                <div className={`mt-1 h-6 w-px ${done ? "bg-green-500/30" : "bg-white/10"}`} />
              )}
            </div>
            {/* Content */}
            <div className="pb-2">
              <p className={`font-quantum text-sm font-medium ${
                active ? "text-cyan-200" : done ? "text-white/60" : "text-white/30"
              }`}>
                {stage.label}
              </p>
              {active && (
                <p className="mt-0.5 font-quantum text-xs text-white/40">{stage.desc}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
