import { getGrowthSimulationResult, getStudentAbilityTrend } from "@/lib/api/client";
import { ProfileHero } from "@/components/profile/profile-hero";
import { AbilityRadarPlaceholder } from "@/components/charts/ability-radar-placeholder";
import { AbilityScoreCards } from "@/components/charts/ability-score-cards";
import { AbilityTrendChart } from "@/components/charts/ability-trend-chart";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuantumWordCloud } from "@/components/profile/quantum-word-cloud";

export default async function StudentProfilePage() {
  const result = await getGrowthSimulationResult("stu_001");
  const trendSeries = await getStudentAbilityTrend("stu_001");

  const strong = result.abilityScores.filter((item) => item.score >= 75).map((item) => item.label);
  const improve = result.abilityScores.filter((item) => item.score < 65).map((item) => item.label);
  const suggest = strong.length
    ? strong.map((item) => `${item}导向岗位`)
    : ["运营协同类岗位", "项目推进类岗位", "组织发展类岗位"];

  const cloudWords = [
    ...strong.map((item, idx) => ({ word: item, size: 20 + ((idx % 3) + 1) * 4, tone: "good" as const })),
    ...improve.map((item, idx) => ({ word: item, size: 16 + ((idx % 2) + 1) * 3, tone: "warn" as const })),
    ...suggest.slice(0, 4).map((item, idx) => ({ word: item, size: 14 + ((idx % 3) + 1) * 2, tone: "neutral" as const })),
  ];

  return (
    <div className="space-y-4">
      <ProfileHero result={result} />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] xl:items-start">
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="quantum-glass-texture overflow-hidden border-cyan-500/20 bg-slate-950/45 backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.06] pb-3">
                <CardTitle className="font-qdisplay text-base">全息洞察流</CardTitle>
                <p className="font-quantum text-xs text-white/45">最近洞察 · 快照 · 标签</p>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {[
                  strong[0] ? `优势展现：${strong[0]}在关键情境中更稳定。` : "优势展现：结构化表达与推进感更稳定。",
                  improve[0] ? `注意项：${improve[0]}在高压追问时波动。` : "注意项：高压追问下的观点压缩仍需训练。",
                ].map((line, idx) => (
                  <div key={idx} className="rounded-[14px] border border-white/[0.08] bg-black/25 p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-9 w-9 shrink-0 rounded-xl border border-cyan-500/20 bg-white/[0.04]" />
                      <div className="min-w-0 flex-1">
                        <p className="font-quantum text-[12px] leading-relaxed text-white/70">{line}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className="border border-cyan-500/15 bg-cyan-500/10 font-quantum text-[10px] text-cyan-100/85">顾问</Badge>
                          <Badge className="border border-white/10 bg-white/5 font-quantum text-[10px] text-white/65">快照</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-[14px] border border-white/[0.08] bg-black/15 p-3 text-center font-quantum text-[10px] tracking-[0.2em] text-white/45">
                  全息快照流
                </div>
              </CardContent>
            </Card>

            <AbilityRadarPlaceholder abilities={result.abilityScores} />
          </div>

          <AbilityScoreCards abilities={result.abilityScores} />

          <Card className="overflow-hidden border-white/10 bg-slate-950/35 backdrop-blur-xl">
            <CardHeader className="border-b border-white/[0.06]">
              <CardTitle className="font-qdisplay text-base">能力标签摘要</CardTitle>
              <p className="font-quantum text-xs text-white/45">优势 / 待提升 / 建议方向</p>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div>
                <p className="mb-2 font-quantum text-[11px] uppercase tracking-wider text-white/45">优势标签</p>
                <div className="flex flex-wrap gap-2">
                  {(strong.length ? strong : ["责任驱动", "执行稳定", "协作积极"]).map((item) => (
                    <Badge key={`good-${item}`} className="border border-cyan-500/20 bg-cyan-500/10 font-quantum text-cyan-100/85">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-quantum text-[11px] uppercase tracking-wider text-white/45">待提升</p>
                <div className="flex flex-wrap gap-2">
                  {(improve.length ? improve : ["高压沟通", "冲突协商", "观点压缩表达"]).map((item) => (
                    <Badge key={`warn-${item}`} className="border border-orange-500/20 bg-orange-500/10 font-quantum text-orange-100/80">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 font-quantum text-[11px] uppercase tracking-wider text-white/45">建议方向</p>
                <div className="flex flex-wrap gap-2">
                  {suggest.map((item) => (
                    <Badge key={`suggest-${item}`} className="border border-violet-500/20 bg-violet-500/10 font-quantum text-violet-100/80">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <QuantumWordCloud words={cloudWords} />
          <AbilityTrendChart series={trendSeries} />
          <div className="relative overflow-hidden rounded-[18px] border border-cyan-500/20 bg-slate-950/55 p-4 shadow-[0_0_40px_rgba(34,211,238,0.10)] backdrop-blur-xl">
            <p className="mb-3 font-qdisplay text-[11px] font-semibold tracking-[0.2em] text-white/70">数据控制台</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04]" />
                ))}
              </div>
              <div className="h-3 flex-1 rounded-full border border-white/10 bg-white/[0.04]" />
              <div className="flex items-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04]" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
