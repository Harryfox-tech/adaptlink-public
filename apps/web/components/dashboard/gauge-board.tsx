import { DashboardMetric } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function parseMetricValue(value: string): number {
  const parsed = Number.parseFloat(value.replace(/[^\d.]/g, ""));
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, parsed));
}

const THEMES = {
  综合能力: {
    stroke: "rgb(34 211 238)",
    glow: "drop-shadow(0 0 8px rgba(34,211,238,0.45))",
    gradient: ["rgb(34 211 238)", "rgb(52 211 153)"],
  },
  模拟训练: {
    stroke: "rgb(249 115 22)",
    glow: "drop-shadow(0 0 8px rgba(249,115,22,0.35))",
    gradient: ["rgb(249 115 22)", "rgb(244 63 94)"],
  },
  岗位匹配: {
    stroke: "rgb(167 139 250)",
    glow: "drop-shadow(0 0 8px rgba(167,139,250,0.35))",
    gradient: ["rgb(59 130 246)", "rgb(167 139 250)"],
  },
  行动完成: {
    stroke: "rgb(244 63 94)",
    glow: "drop-shadow(0 0 8px rgba(244,63,94,0.35))",
    gradient: ["rgb(217 70 239)", "rgb(244 63 94)"],
  },
} as const;

function RingGauge({ label, value }: { label: string; value: number }) {
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 100) * circumference;
  // deterministic id for SSR/CSR consistency
  const gradId = `qRing-${label.replace(/\s+/g, "-")}`;
  const theme = (THEMES as any)[label] ?? THEMES["综合能力"];

  return (
    <div className="quantum-glass-texture flex flex-col items-center gap-1 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <svg width="72" height="72" viewBox="0 0 72 72" className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={theme.gradient[0]} />
            <stop offset="100%" stopColor={theme.gradient[1]} />
          </linearGradient>
        </defs>
        <circle cx="36" cy="36" r={radius} stroke="rgba(255,255,255,0.10)" strokeWidth="7" fill="none" />
        <circle
          cx="36"
          cy="36"
          r={radius}
          stroke={`url(#${gradId})`}
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${progress} ${circumference - progress}`}
          style={{ filter: theme.glow }}
        />
      </svg>
      <p className="font-quantum text-[10px] text-white/55">{label}</p>
      <p className="font-quantum text-base font-semibold tabular-nums text-white/90">{Math.round(value)}</p>
    </div>
  );
}

export function GaugeBoard({ metrics, embedded = false }: { metrics: DashboardMetric[]; embedded?: boolean }) {
  const compact = metrics.slice(0, 4).map((item) => ({
    label: item.title,
    value: parseMetricValue(item.value),
  }));
  const fallback = [
    { label: "综合能力", value: 0 },
    { label: "模拟训练", value: 0 },
    { label: "岗位匹配", value: 0 },
    { label: "行动完成", value: 0 },
  ];
  const data = compact.length ? compact : fallback;

  const content = (
    <>
      <CardHeader className="pb-2">
        <CardTitle className="font-qdisplay text-base">实时模拟指标</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {data.map((item) => (
            <RingGauge key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </CardContent>
    </>
  );

  if (embedded) return <>{content}</>;

  return (
    <Card className={cn("min-h-[340px] overflow-hidden bg-slate-950/35", "border-cyan-500/25")}>
      {content}
    </Card>
  );
}
