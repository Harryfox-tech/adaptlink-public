"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { actSimulationAgent, startSimulationAgent, talkSimulationEpisode } from "@/lib/api/client";
import { RecalledMemory, SimulationEpisode } from "@/lib/types";
import { AgentReasoningPanel } from "@/components/simulator/agent-reasoning-panel";
import { RecalledMemoriesPanel } from "@/components/simulator/recalled-memories-panel";
import { EndingModal } from "@/components/simulator/ending-modal";
import { AbilityScoreCards } from "@/components/charts/ability-score-cards";
import { AgentReviewList } from "@/components/simulator/agent-review-list";
import { JobRecommendationList } from "@/components/simulator/job-recommendation-list";
import { QuantumCommandDeck, QuantumDataBanner, QuantumStoryConsole } from "@/components/neo/quantum-sim-panels";
import { QuantumTalentHeroPanel } from "@/components/neo/quantum-talent-hero";
import { QuantumActionTimeline, QuantumCompetencyRadar, QuantumRhythmBlock } from "@/components/neo/quantum-status-bento";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProgressMeta = {
  active: boolean;
  value: number;
  stage: string;
};

type ProgressStage = {
  label: string;
  durationMs: number;
};

export function StorylineSimulator({
  title,
  description,
  tags,
  simulationType,
  defaultTarget,
}: {
  title: string;
  description: string;
  tags: string[];
  simulationType: "growth" | "job";
  defaultTarget: string;
}) {
  const [targetRole, setTargetRole] = useState(defaultTarget);
  const [goalContext, setGoalContext] = useState("");
  const [personalStrength, setPersonalStrength] = useState("");
  const [challengeBoundary, setChallengeBoundary] = useState("");
  const [successSignal, setSuccessSignal] = useState("");
  const [episode, setEpisode] = useState<SimulationEpisode | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [talkInput, setTalkInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressMeta>({ active: false, value: 0, stage: "待命" });
  const [reasoningTrace, setReasoningTrace] = useState<string[]>([]);
  const [recalledMemories, setRecalledMemories] = useState<RecalledMemory[]>([]);
  const [agentEngine, setAgentEngine] = useState<string>("mock");
  const [showEndingModal, setShowEndingModal] = useState(false);

  const latestTurn = useMemo(() => (episode?.turns.length ? episode.turns[episode.turns.length - 1] : null), [episode]);

  const targetSummary = [
    `目标角色：${targetRole || defaultTarget}`,
    `场景目标：${goalContext || "在高压情境下稳定推进任务"}`,
    `优势证据：${personalStrength || "具备基础执行与协作能力"}`,
    `挑战边界：${challengeBoundary || "面对追问时表达不够结构化"}`,
    `成功标准：${successSignal || "形成可执行方案并获得正反馈"}`,
  ].join("；");

  const withRealProgress = async <T,>(stages: ProgressStage[], task: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    const total = stages.reduce((sum, item) => sum + item.durationMs, 0);
    const started = Date.now();
    setProgress({ active: true, value: 6, stage: stages[0]?.label ?? "处理中" });
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      let cursor = 0;
      let remain = elapsed;
      for (const stage of stages) {
        if (remain <= stage.durationMs) break;
        remain -= stage.durationMs;
        cursor += 1;
      }
      const ratio = Math.min(0.95, elapsed / Math.max(600, total));
      setProgress({
        active: true,
        value: Math.max(6, Math.round(ratio * 95)),
        stage: stages[Math.min(cursor, stages.length - 1)]?.label ?? "处理中",
      });
    }, 120);
    try {
      const result = await task();
      setProgress({ active: true, value: 100, stage: "完成" });
      return result;
    } finally {
      clearInterval(timer);
      setLoading(false);
      setTimeout(() => setProgress({ active: false, value: 0, stage: "待命" }), 900);
    }
  };

  const appendTraceLine = (line: string) => {
    setReasoningTrace((prev) => (prev.includes(line) ? prev : [...prev, line]));
  };

  const startEpisode = async () => {
    if (!targetRole.trim()) {
      setError("请先填写目标角色。");
      return;
    }
    try {
      setReasoningTrace([]);
      const created = await withRealProgress(
        [
          { label: "构建剧情世界观", durationMs: 1000 },
          { label: "生成角色问题线", durationMs: 1400 },
          { label: "初始化状态与评分", durationMs: 900 },
        ],
        async () => {
          const result = await startSimulationAgent(
            {
              studentId: "stu_001",
              simulationType,
              target: targetSummary,
            },
            { onTrace: appendTraceLine },
          );
          setReasoningTrace(result.reasoningTrace);
          setRecalledMemories(result.recalledMemories);
          setAgentEngine(result.engine);
          return result.episode;
        },
      );
      setEpisode(created);
      setAnswerInput("");
      setTalkInput("");
      setShowEndingModal(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "启动剧情失败");
    }
  };

  const submitTurn = async () => {
    if (!episode || !answerInput.trim()) return;
    try {
      const next = await withRealProgress(
        [
          { label: "解析你的回答", durationMs: 900 },
          { label: "评估能力变化", durationMs: 1300 },
          { label: "生成下一轮问题", durationMs: 900 },
        ],
        async () => {
          const result = await actSimulationAgent(episode.episodeId, answerInput.trim(), {
            onTrace: appendTraceLine,
          });
          setReasoningTrace(result.reasoningTrace);
          setRecalledMemories(result.recalledMemories.length ? result.recalledMemories : recalledMemories);
          setAgentEngine(result.engine);
          if (result.endingTriggered && result.episode.ending) {
            setShowEndingModal(true);
          }
          return result.episode;
        },
      );
      setEpisode(next);
      setAnswerInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交回合失败");
    }
  };

  const askRole = async () => {
    if (!episode || !talkInput.trim()) return;
    try {
      const response = await withRealProgress(
        [
          { label: "理解追问语义", durationMs: 700 },
          { label: "角色组织回答", durationMs: 900 },
          { label: "同步上下文", durationMs: 500 },
        ],
        () => talkSimulationEpisode(episode.episodeId, talkInput.trim()),
      );
      setEpisode({ ...episode, dialogue: response.dialogue });
      setTalkInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "角色追问失败");
    }
  };

  const submitChoice = async (choice: string) => {
    if (!episode || !choice.trim()) return;
    try {
      setAnswerInput(choice);
      const next = await withRealProgress(
        [
          { label: "解析你的选择", durationMs: 800 },
          { label: "计算事件影响", durationMs: 1200 },
          { label: "生成下一段剧情", durationMs: 1000 },
        ],
        async () => {
          const result = await actSimulationAgent(episode.episodeId, choice.trim(), {
            onTrace: appendTraceLine,
          });
          setReasoningTrace(result.reasoningTrace);
          setRecalledMemories(result.recalledMemories.length ? result.recalledMemories : recalledMemories);
          setAgentEngine(result.engine);
          if (result.endingTriggered && result.episode.ending) {
            setShowEndingModal(true);
          }
          return result.episode;
        },
      );
      setEpisode(next);
      setAnswerInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交选择失败");
    }
  };

  const statusTips = latestTurn?.aggregate.recommendations?.slice(0, 3) ?? ["保持表达结构化", "先给结论再补证据", "每轮回答控制在3点以内"];
  const activeEvent = episode?.currentEvent;
  const eventChoices: string[] = episode?.status === "completed" ? [] : activeEvent?.choices ?? [];
  const currentNarrative = latestTurn
    ? `你本轮选择：${latestTurn.choice}\n\n${latestTurn.narrative}`
    : activeEvent?.openingLine ?? "请开始剧情，系统会生成当前事件与角色冲突。";
  const sceneImageSrc = simulationType === "job" ? "/pic/job.png" : "/pic/chengzhang.png";
  const sceneImageLabel = simulationType === "job" ? "求职模拟场景" : "成长模拟场景";
  const statusCards = [
    { label: "信心", value: episode?.state.confidence ?? 0, color: "from-cyan-400 to-blue-500" },
    { label: "压力", value: episode?.state.pressure ?? 0, color: "from-amber-400 to-orange-500" },
    { label: "精力", value: episode?.state.energy ?? 0, color: "from-emerald-400 to-lime-500" },
    { label: "准备度", value: episode?.state.readiness ?? 0, color: "from-sky-400 to-cyan-500" },
  ];

  const answerFramework = [
    "【回答框架】",
    activeEvent?.title ? `问题主题：${activeEvent.title}` : "问题主题：—",
    "",
    "1) 结论（先给一句话答案）",
    "2) 拆解（2-3 点要点，按重要性排序）",
    "3) 证据（STAR：情境-任务-行动-结果，用数据/事实）",
    "4) 风险与权衡（你考虑到的边界/取舍）",
    "5) 复盘与下一步（如果再来一次你会如何优化）",
  ].join("\n");

  const copyFramework = async () => {
    try {
      await navigator.clipboard.writeText(answerFramework);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setError("复制失败：请检查浏览器权限或手动复制。");
    }
  };

  const rhythmExpression = episode ? Math.min(100, episode.state.readiness + 10) : 0;
  const rhythmEmotion = episode ? Math.max(0, 100 - episode.state.pressure) : 0;

  return (
    <div className="space-y-6">
      <section className="mb-10 border-b border-white/10 pb-8">
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_560px]">
          <div className="space-y-4">
            <h1 className="font-qdisplay text-5xl font-bold tracking-tight text-white">{title}</h1>
            <p className="font-quantum text-[18px] leading-snug text-white/65">{description}</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <div className="inline-flex flex-wrap gap-2 text-xs text-white/55">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Enter：提交回答</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Esc：清空输入</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">Agent 模式</span>
            </div>
            <RecalledMemoriesPanel memories={recalledMemories} className="mt-3" />
            <AgentReasoningPanel trace={reasoningTrace} engine={agentEngine} className="mt-3" />
          </div>
          <div className="min-h-[200px] w-full">
            <QuantumTalentHeroPanel imageSrc="/pic/3.png" />
          </div>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.3)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">当前剧情</p>
                <h2 className="text-2xl font-semibold text-white">{activeEvent?.title ?? "等待生成剧情事件"}</h2>
                <p className="max-w-2xl text-sm leading-7 text-white/65">{activeEvent?.description ?? "请填写目标角色并启动剧情，系统会自动构建事件、对话和多Agent评估线路。"}</p>
              </div>
              <div className="relative h-44 w-full overflow-hidden rounded-[24px] border border-white/10 bg-slate-900/60 sm:h-56 sm:w-56">
                <Image src={sceneImageSrc} alt={sceneImageLabel} fill className="object-cover object-center opacity-95" />
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/95 via-slate-950/0" />
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {activeEvent ? [activeEvent.npcRole, activeEvent.npcGoal].filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] text-cyan-100">{tag}</span>
              )) : null}
            </div>
            {eventChoices.length ? (
              <div className="mt-5 space-y-3 rounded-[24px] border border-white/10 bg-slate-950/40 p-5 shadow-[inset_0_0_30px_rgba(255,255,255,0.04)]">
                <p className="text-xs uppercase tracking-[0.24em] text-white/50">选择你的行动</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {eventChoices.map((choice) => (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => void submitChoice(choice)}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-white transition hover:border-cyan-400/30 hover:bg-cyan-500/10"
                    >
                      {choice}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-5 rounded-[22px] border border-white/10 bg-slate-950/40 p-5 text-sm leading-7 text-white/75 shadow-[inset_0_0_30px_rgba(255,255,255,0.02)]">
              <p className="mb-3 text-xs uppercase tracking-[0.24em] text-white/50">剧情推演</p>
              <p className="whitespace-pre-line">{currentNarrative}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">状态面板</p>
              <div className="mt-4 space-y-4">
                {statusCards.map((card) => (
                  <div key={card.label} className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>{card.label}</span>
                      <span className="font-semibold text-white">{card.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className={`h-full rounded-full bg-gradient-to-r ${card.color}`} style={{ width: `${card.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-950/60 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.25)] backdrop-blur-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">反馈建议</p>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                {statusTips.map((tip) => (
                  <p key={tip} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">• {tip}</p>
                ))}
              </div>
              <div className="mt-4 rounded-[18px] border border-white/10 bg-slate-950/30 p-3 text-[12px] text-cyan-100">
                当前事件：{activeEvent?.title ?? "暂无事件"}
              </div>
              {episode?.dialogue?.length ? (
                <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/30 p-4 text-sm text-white/75">
                  <p className="mb-3 text-xs uppercase tracking-[0.24em] text-white/50">当前对话</p>
                  <div className="space-y-3">
                    {episode.dialogue.slice(-4).map((msg, index) => (
                      <div key={`${msg.timestamp}-${index}`} className={`rounded-2xl p-3 ${msg.speaker === "npc" ? "bg-white/5 text-white" : "bg-cyan-500/10 text-cyan-100"}`}>
                        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-white/40">
                          <span>{msg.speaker === "npc" ? "NPC" : "你"}</span>
                          <span>•</span>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="leading-6">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>剧情开局设置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-white/55">目标角色</p>
            <Input value={targetRole} onChange={(e) => setTargetRole(e.target.value)} placeholder="例如：成为能独立带队的校园项目负责人" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/55">场景目标（要达成什么）</p>
            <Input value={goalContext} onChange={(e) => setGoalContext(e.target.value)} placeholder="例如：在高压场景中稳定推进任务并达成共识" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/55">优势证据（项目、成果、技能）</p>
            <Textarea value={personalStrength} onChange={(e) => setPersonalStrength(e.target.value)} placeholder="填写能支撑你回答的关键证据" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/55">挑战边界（你最担心什么）</p>
            <Textarea value={challengeBoundary} onChange={(e) => setChallengeBoundary(e.target.value)} placeholder="写出你担心的风险点" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/55">成功信号（如何算成功）</p>
            <Textarea value={successSignal} onChange={(e) => setSuccessSignal(e.target.value)} placeholder="例如：获得正反馈并进入下一阶段" />
          </div>
          <div className="flex justify-center pt-2">
            <Button onClick={startEpisode} disabled={loading} className="min-w-48">
              {episode ? "重新开始剧情" : "开始剧情"}
            </Button>
          </div>

          <div className="py-4">
            <div className="mx-auto max-w-2xl rounded-[16px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="mb-3 flex items-center justify-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/30" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/25 [animation-delay:120ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/20 [animation-delay:240ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300/90 [animation-delay:360ms]" />
                </div>
                <p className="text-xs text-white/55">{progress.active ? progress.stage : "准备就绪，等待开始"}</p>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-400 transition-all duration-300 ease-out"
                  style={{ width: `${progress.active ? progress.value : 0}%` }}
                />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent_0%,rgba(255,255,255,0.7)_35%,transparent_70%)] [background-size:180%_100%] animate-[pulse_1.2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {episode ? (
        <div
          className={cn(
            "relative grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(300px,440px)] xl:items-start",
            episode.state.pressure > 70 && "xl:[&_.quantum-deck-shell]:ring-1 xl:[&_.quantum-deck-shell]:ring-red-500/25",
            episode.state.confidence > 75 && "xl:[&_.quantum-deck-shell]:shadow-[0_0_55px_rgba(34,211,238,0.14)]",
          )}
        >
          {loading ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 rounded-[24px] bg-slate-950/50 backdrop-blur-[5px]"
              aria-busy="true"
              aria-label="处理中"
            />
          ) : null}

          <div className="quantum-deck-shell space-y-4 rounded-[24px] p-[1px]">
            <QuantumDataBanner
              currentStage={episode.currentStage}
              totalStages={episode.totalStages}
              episodeId={episode.episodeId}
            />
            <div className="flex flex-wrap items-center gap-2 px-0.5">
              <Badge className="font-quantum text-[10px]">{episode.status}</Badge>
              <Badge className="font-quantum text-[10px]">{simulationType}</Badge>
              {episode.currentEvent ? (
                <Badge className="border-white/15 bg-white/10 font-quantum text-[10px]">{episode.currentEvent.npcRole}</Badge>
              ) : null}
            </div>
            <QuantumStoryConsole
              event={episode.currentEvent}
              latestTurn={latestTurn}
              streamKey={`${episode.episodeId}-${episode.currentStage}-${episode.currentEvent?.id ?? "none"}-${latestTurn?.turn ?? 0}`}
              dialogue={episode.dialogue}
              npcImageSrc="/pic/2.png"
            />
            {episode.status !== "completed" ? (
              <QuantumCommandDeck
                answerInput={answerInput}
                onAnswerChange={setAnswerInput}
                onSubmit={submitTurn}
                loading={loading}
                talkInput={talkInput}
                onTalkChange={setTalkInput}
                onAsk={askRole}
                storyChoices={eventChoices}
                onChoose={submitChoice}
                catImageSrc="/pic/1.png"
              />
            ) : null}
          </div>

          <aside className="min-w-0 space-y-4 xl:sticky xl:top-24 xl:z-10 xl:self-start xl:max-h-[calc(100vh-6rem)] xl:overflow-y-auto xl:overflow-x-hidden xl:pb-2">
            <Card className="overflow-hidden border-cyan-500/30 bg-slate-950/55 shadow-[0_0_44px_rgba(34,211,238,0.1)] backdrop-blur-xl">
              <CardHeader className="border-b border-white/[0.06] pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="font-qdisplay text-base">实时状态</CardTitle>
                    <p className="mt-1 font-quantum text-[10px] text-white/45">Metrics · Timeline · Rhythm</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" className="shrink-0 font-quantum text-[11px]" onClick={() => void copyFramework()}>
                    {copied ? "已复制" : "复制回答框架"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-2 font-quantum text-sm">
                <QuantumCompetencyRadar
                  confidence={episode.state.confidence}
                  pressure={episode.state.pressure}
                  energy={episode.state.energy}
                  readiness={episode.state.readiness}
                />
                <QuantumActionTimeline tips={statusTips} />
                <QuantumRhythmBlock expression={rhythmExpression} emotion={rhythmEmotion} />
              </CardContent>
            </Card>
          </aside>
        </div>
      ) : null}

      {latestTurn ? (
        <div className="space-y-4">
          <AbilityScoreCards abilities={latestTurn.aggregate.abilityScores} />
          <AgentReviewList reviews={latestTurn.aggregate.agentReviews} />
          {simulationType === "job" && latestTurn.aggregate.jobMatches?.length ? <JobRecommendationList jobs={latestTurn.aggregate.jobMatches} /> : null}
        </div>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <EndingModal
        open={showEndingModal && Boolean(episode?.ending)}
        ending={episode?.ending!}
        endingType={episode?.endingType}
        episode={episode}
        onClose={() => setShowEndingModal(false)}
      />
    </div>
  );
}
