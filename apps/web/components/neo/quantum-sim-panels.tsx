"use client";

import Image from "next/image";
import * as React from "react";
import type { EpisodeDialogueMessage, EpisodeEvent, EpisodeTurnResult } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { QuantumActivateButton } from "@/components/neo/quantum-activate-button";
import { Cog, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function useStreamedText(full: string, runKey: string) {
  const [out, setOut] = React.useState("");
  React.useEffect(() => {
    setOut("");
    if (!full) return;
    let i = 0;
    const per = Math.max(8, Math.min(28, Math.floor(900 / Math.max(1, full.length))));
    const id = window.setInterval(() => {
      i += 1;
      setOut(full.slice(0, i));
      if (i >= full.length) window.clearInterval(id);
    }, per);
    return () => window.clearInterval(id);
  }, [runKey, full]);
  return out;
}

export function QuantumDataBanner({
  currentStage,
  totalStages,
  episodeId,
}: {
  currentStage: number;
  totalStages: number;
  episodeId: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[14px] border border-cyan-500/35 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/70 p-4 shadow-[0_0_30px_rgba(34,211,238,0.15)]">
      <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-violet-500 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
      <div className="pl-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="font-qdisplay bg-gradient-to-r from-cyan-200 via-white to-violet-200 bg-clip-text text-lg font-bold uppercase tracking-[0.12em] text-transparent md:text-xl">
            Quantum Career Sim-Pod
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            {Array.from({ length: totalStages }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border transition-all",
                  i + 1 < currentStage && "border-emerald-400/70 bg-emerald-400/35 shadow-[0_0_10px_rgba(52,211,153,0.35)]",
                  i + 1 === currentStage &&
                    "border-cyan-300 bg-cyan-400/40 shadow-[0_0_14px_rgba(34,211,238,0.55)] ring-2 ring-cyan-400/25",
                  i + 1 > currentStage && "border-white/12 bg-white/[0.06]",
                )}
                title={`阶段 ${i + 1}`}
              />
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="font-quantum text-[11px] text-cyan-300/80">剧情阶段 {currentStage}/{totalStages}</span>
          <Badge className="max-w-[min(100%,280px)] truncate border-cyan-500/30 bg-black/40 font-quantum text-[10px] text-cyan-100/90" title={episodeId}>
            {episodeId}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function QuantumStoryConsole({
  event,
  latestTurn,
  streamKey,
  dialogue,
  npcImageSrc,
}: {
  event: EpisodeEvent | null;
  latestTurn?: EpisodeTurnResult | null;
  streamKey: string;
  dialogue: EpisodeDialogueMessage[];
  npcImageSrc: string;
}) {
  const turnScoreText = latestTurn
    ? [
        `本轮选择：${latestTurn.choice}`,
        `综合得分：${Math.round(latestTurn.aggregate.overallScore)} / 100`,
        `状态变化：信心 ${latestTurn.stateAfter.confidence}，压力 ${latestTurn.stateAfter.pressure}，精力 ${latestTurn.stateAfter.energy}，准备度 ${latestTurn.stateAfter.readiness}`,
        latestTurn.aggregate.abilityScores?.length
          ? `能力分：${latestTurn.aggregate.abilityScores
              .slice(0, 8)
              .map((item) => `${item.label} ${Math.round(item.score)}`)
              .join("；")}`
          : "",
      ]
        .filter(Boolean)
        .join("\n")
    : "";
  const nextSituationText = event ? `下一幕：${event.title}\n\n${event.description}\n\n${event.openingLine}` : "";
  const situationText = latestTurn
    ? `${turnScoreText}\n\n【剧情推演】\n${latestTurn.narrative}${nextSituationText ? `\n\n【下一幕情境】\n${nextSituationText}` : ""}`
    : nextSituationText;
  const streamed = useStreamedText(situationText, streamKey);

  return (
    <div
      className={cn(
        "quantum-scanline quantum-glass-texture relative overflow-hidden rounded-[20px] border border-cyan-500/30 bg-slate-950/45 p-5 shadow-[0_0_40px_rgba(34,211,238,0.1)] backdrop-blur-xl",
      )}
    >
      <p className="font-quantum text-[10px] uppercase tracking-[0.35em] text-cyan-400/80">剧情全息显示 · STORY CONSOLE</p>

      {situationText ? (
        <div className="mt-4 rounded-[14px] border border-white/[0.08] bg-black/30 p-4">
          <p className="font-quantum text-[10px] uppercase tracking-widest text-cyan-300/70">// 当前情境</p>
          <pre className="mt-3 max-h-[620px] overflow-y-auto whitespace-pre-wrap font-quantum text-[13px] leading-7 text-white/84">{streamed}</pre>
        </div>
      ) : null}

      <div className="mt-5">
        <p className="mb-2 font-qdisplay text-[11px] font-semibold uppercase tracking-wider text-white/50">角色对话</p>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
          <div className="min-h-[140px] min-w-0 flex-1 space-y-2 overflow-y-auto rounded-[14px] border border-cyan-500/25 bg-white/[0.04] p-3 lg:max-h-56">
            {dialogue.map((msg, idx) => (
              <div key={`${msg.timestamp}-${idx}`} className={msg.speaker === "user" ? "text-right" : "text-left"}>
                <div
                  className={cn(
                    "inline-block max-w-[94%] rounded-xl px-3 py-2 text-left font-quantum text-[13px] leading-relaxed",
                    msg.speaker === "user"
                      ? "ml-auto border border-cyan-400/25 bg-gradient-to-br from-cyan-500/20 to-blue-600/10 text-white shadow-[0_0_18px_rgba(34,211,238,0.12)]"
                      : "border border-white/10 bg-white/[0.06] text-white/88 quantum-glitch-text",
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
          <div className="relative mx-auto h-[160px] w-[140px] shrink-0 lg:mx-0 lg:h-[210px] lg:w-[158px]">
            <div className="relative h-full w-full overflow-hidden rounded-[16px] border border-cyan-500/15 bg-[radial-gradient(ellipse_at_50%_35%,rgba(34,211,238,0.14),rgba(15,23,42,0.92)_52%,rgb(2,6,23)_100%)] shadow-[0_0_32px_rgba(34,211,238,0.18),inset_0_0_40px_rgba(168,85,247,0.06)] backdrop-blur-md">
              <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:repeating-linear-gradient(0deg,transparent,transparent_5px,rgba(34,211,238,0.05)_5px,rgba(34,211,238,0.05)_6px),repeating-linear-gradient(90deg,transparent,transparent_5px,rgba(168,85,247,0.04)_5px,rgba(168,85,247,0.04)_6px)]" />
              <div className="pointer-events-none absolute left-2 top-6 h-24 w-px bg-gradient-to-b from-cyan-400/50 via-cyan-300/20 to-transparent" aria-hidden />
              <div className="pointer-events-none absolute right-3 top-8 h-16 w-px bg-gradient-to-b from-transparent via-violet-400/35 to-fuchsia-500/20" aria-hidden />
              <div className="pointer-events-none absolute bottom-10 left-3 flex flex-col gap-2">
                <HelpCircle className="h-3.5 w-3.5 text-cyan-400/55 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]" aria-hidden />
                <Cog className="h-3.5 w-3.5 text-violet-400/50 drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]" aria-hidden />
              </div>
              <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 flex-col gap-3">
                <span className="h-8 w-[2px] rounded-full bg-gradient-to-b from-transparent via-cyan-400/40 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.4)]" />
                <span className="h-8 w-[2px] rounded-full bg-gradient-to-b from-violet-400/30 to-transparent" />
              </div>
              <div className="absolute bottom-2 left-2 z-[2] h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.85)]" title="online" />
              <Image
                src={npcImageSrc}
                alt="数字化点云导师"
                width={400}
                height={480}
                className="relative z-[1] h-full w-full object-contain object-center p-2 drop-shadow-[0_0_18px_rgba(59,130,246,0.35)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function QuantumCommandDeck({
  answerInput,
  onAnswerChange,
  onSubmit,
  loading,
  talkInput,
  onTalkChange,
  onAsk,
  storyChoices = [],
  onChoose,
  catImageSrc,
}: {
  answerInput: string;
  onAnswerChange: (v: string) => void;
  onSubmit: () => void;
  loading: boolean;
  talkInput: string;
  onTalkChange: (v: string) => void;
  onAsk: () => void;
  storyChoices?: string[];
  onChoose?: (choice: string) => void;
  catImageSrc: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-orange-500/40 bg-slate-950/50 p-5 shadow-[0_0_36px_rgba(249,115,22,0.12)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_circle_at_20%_0%,rgba(34,211,238,0.08),transparent_55%)]" />
      <p className="font-quantum text-[10px] uppercase tracking-[0.3em] text-orange-200/70">命令输入台 · COMMAND INPUT</p>
      {storyChoices.length ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-2">
          {storyChoices.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => onChoose?.(choice)}
              className="rounded-2xl border border-orange-500/25 bg-orange-500/10 px-4 py-3 text-left text-sm text-white transition hover:border-orange-300/40 hover:bg-orange-500/15"
            >
              {choice}
            </button>
          ))}
        </div>
      ) : null}
      <div className="relative mt-4 flex flex-col gap-4 md:flex-row md:items-start">
        <div className="relative mx-auto flex h-28 w-28 shrink-0 items-center justify-center md:mx-0 md:h-32 md:w-32">
          <div className="relative h-full w-full overflow-hidden rounded-2xl border border-cyan-500/10 bg-[radial-gradient(ellipse_at_45%_40%,rgba(34,211,238,0.18),rgba(15,23,42,0.96)_50%,rgb(2,6,23)_100%)] shadow-[0_0_28px_rgba(34,211,238,0.12),inset_0_0_32px_rgba(168,85,247,0.05)] backdrop-blur-xl">
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{
                backgroundImage: `repeating-linear-gradient(135deg, transparent, transparent 4px, rgba(34,211,238,0.07) 4px, rgba(34,211,238,0.07) 5px), repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(168,85,247,0.05) 6px, rgba(168,85,247,0.05) 7px)`,
              }}
            />
            <Image
              src={catImageSrc}
              alt="霓虹线条猫"
              width={256}
              height={256}
              className="relative z-[1] h-full w-full object-contain p-2 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]"
            />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "quantum-command-wrap rounded-[14px] border border-orange-500/35 bg-slate-950/60 p-[1px]",
              answerInput.trim().length > 0 && "neo-energy-input-active",
            )}
          >
            <Textarea
              value={answerInput}
              onChange={(e) => onAnswerChange(e.target.value)}
              placeholder="请输入你的行动方案或自主决策..."
              className={cn(
                "min-h-[200px] resize-y border-0 bg-transparent font-quantum text-[13px] leading-relaxed text-white/90 placeholder:text-white/35 focus-visible:ring-0",
              )}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-white/45">或直接选择上方剧情选项，输入自定义行动也可直接提交</div>
            <QuantumActivateButton onClick={onSubmit} disabled={loading} loading={loading} />
          </div>
        </div>
      </div>

      <div className="relative mt-5 border-t border-white/[0.06] pt-4">
        <p className="mb-2 font-quantum text-[10px] uppercase tracking-wider text-white/40">追问角色（可选）</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={talkInput}
            onChange={(e) => onTalkChange(e.target.value)}
            placeholder="向角色追问..."
            className="flex-1 border-white/10 bg-white/[0.04] font-quantum"
          />
          <Button variant="outline" onClick={onAsk} disabled={loading} className="shrink-0 border-cyan-500/30">
            对话
          </Button>
        </div>
      </div>
    </div>
  );
}
