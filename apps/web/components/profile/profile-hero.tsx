import Image from "next/image";
import { SimulationResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { GaugeBoard } from "@/components/dashboard/gauge-board";

function toMetricValue(value: number): string {
  return `${Math.max(0, Math.min(100, Math.round(value)))}`;
}

export function ProfileHero({ result }: { result: SimulationResult }) {
  const avg = result.abilityScores.length
    ? result.abilityScores.reduce((sum, item) => sum + item.score, 0) / result.abilityScores.length
    : 0;

  const metrics = [
    { title: "综合能力", value: toMetricValue(result.overallScore || avg), delta: "+0", hint: "来自最近成长模拟" },
    { title: "模拟训练", value: toMetricValue(Math.min(100, 20 + result.abilityScores.length * 10)), delta: "+0", hint: "来自模拟训练参与度" },
    { title: "岗位匹配", value: toMetricValue(avg), delta: "+0", hint: "基于能力均值估算" },
    { title: "行动完成", value: toMetricValue(Math.max(0, avg - 10)), delta: "+0", hint: "由执行与协作能力折算" },
  ];

  return (
    <section className="mb-6 border-b border-white/10 pb-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:items-start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="font-qdisplay text-3xl font-bold tracking-tight text-white md:text-4xl">
              全球人才档案 <span className="text-white/60">· 成长作品集</span>
            </h1>
            <p className="font-quantum text-sm leading-relaxed text-white/55 md:text-base">
              沉淀模拟评估结果与能力画像变化，支撑长期成长与求职决策。
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className="border border-cyan-500/20 bg-cyan-500/10 font-quantum text-cyan-100/90">沉淀模拟评估</Badge>
            <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">能力趋势</Badge>
            <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">状态机</Badge>
          </div>

          <div className="quantum-glass-texture relative overflow-hidden rounded-[18px] border border-white/10 bg-slate-950/45 p-3 backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(720px_circle_at_20%_10%,rgba(34,211,238,0.10),transparent_55%)]" />
            <div className="relative h-36 w-full overflow-hidden rounded-[14px] md:h-44">
              <Image
                src="/pic/chengzhang.png"
                alt="成长档案主视觉"
                width={1024}
                height={420}
                className="h-full w-full object-cover object-center opacity-90"
                priority
              />
            </div>
          </div>
        </div>

        <GaugeBoard metrics={metrics} />
      </div>
    </section>
  );
}
