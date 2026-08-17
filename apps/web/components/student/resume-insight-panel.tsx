"use client";

import { useState } from "react";
import { analyzeStudentResume, extractStudentResumeFromFile, optimizeResumeWithAgent } from "@/lib/api/client";
import { ResumeAnalysis, ResumeOptimizeResult, ResumeSnapshot } from "@/lib/types";
import { AgentReasoningPanel } from "@/components/simulator/agent-reasoning-panel";
import {
  AutoRunProgressPanel,
  type AutoRunTurnEvent,
} from "@/components/simulator/auto-run-progress-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/neo/glass-card";
import { cn } from "@/lib/utils";
import { useStudentSession } from "@/components/student/student-session-provider";

type ResumeTab = "input" | "analysis" | "optimize";

const tabs: { key: ResumeTab; label: string }[] = [
  { key: "input", label: "简历输入" },
  { key: "analysis", label: "匹配分析" },
  { key: "optimize", label: "AI 优化" },
];

export function ResumeInsightPanel({ snapshot, embedded = false }: { snapshot?: ResumeSnapshot; embedded?: boolean }) {
  const { studentId } = useStudentSession();
  const [resumeName, setResumeName] = useState(snapshot?.resumeName ?? "我的简历.pdf");
  const [targetJob, setTargetJob] = useState(snapshot?.targetJob ?? "产品运营专员");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("待命");
  const [hint, setHint] = useState<string | null>(null);
  const [optimizeResult, setOptimizeResult] = useState<ResumeOptimizeResult | null>(null);
  const [playerStrategy, setPlayerStrategy] = useState<"conservative" | "aggressive" | "random">("conservative");
  const [liveTrace, setLiveTrace] = useState<string[]>([]);
  const [autoRunTurns, setAutoRunTurns] = useState<AutoRunTurnEvent[]>([]);
  const [liveEngine, setLiveEngine] = useState("mock");
  const [activeTab, setActiveTab] = useState<ResumeTab>("input");

  const withProgress = async <T,>(stages: { label: string; ms: number }[], task: () => Promise<T>) => {
    setLoading(true);
    const total = stages.reduce((sum, s) => sum + s.ms, 0);
    const started = Date.now();
    setProgress(8);
    setStage(stages[0]?.label ?? "处理中");
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      let index = 0;
      let remain = elapsed;
      for (const s of stages) {
        if (remain <= s.ms) break;
        remain -= s.ms;
        index += 1;
      }
      setStage(stages[Math.min(index, stages.length - 1)]?.label ?? "处理中");
      setProgress(Math.round(Math.max(8, Math.min(95, (elapsed / Math.max(700, total)) * 95))));
    }, 120);
    try {
      const result = await task();
      setProgress(100);
      setStage("完成");
      return result;
    } finally {
      clearInterval(timer);
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setResumeName(file.name);
    try {
      const extracted = await withProgress(
        [
          { label: "读取文件", ms: 450 },
          { label: "提取文本", ms: 1000 },
          { label: "回填内容", ms: 500 },
        ],
        () => extractStudentResumeFromFile({ studentId: studentId, file }),
      );
      setResumeText(extracted.extractedText);
      setHint(`已提取 ${extracted.charCount} 字（${extracted.fileType.toUpperCase()}）`);
    } catch {
      setHint("提取失败，请更换文件或手动粘贴。");
    }
  };

  const runOptimize = async () => {
    if (!resumeText.trim()) return;
    try {
      setLoading(true);
      setProgress(8);
      setStage("Agent 启动中…");
      setLiveTrace([]);
      setAutoRunTurns([]);
      setOptimizeResult(null);
      setHint(null);

      const appendTrace = (line: string) => {
        setLiveTrace((prev) => (prev.includes(line) ? prev : [...prev, line]));
        setStage(line.startsWith("[AutoRun]") ? line.replace("[AutoRun] ", "") : line.slice(0, 48));
        if (line.includes("openai")) setLiveEngine("openai");
        const autoRunMatch = line.match(/第 (\d+)\/(\d+) 幕/);
        if (autoRunMatch) {
          const turn = Number(autoRunMatch[1]);
          const max = Number(autoRunMatch[2]);
          setProgress(Math.min(95, Math.round((turn / max) * 90) + 5));
        }
      };

      const appendTurn = (event: AutoRunTurnEvent) => {
        setAutoRunTurns((prev) => [...prev, event]);
        if (event.phase === "turn_complete" && event.maxTurns > 0) {
          setProgress(Math.min(95, Math.round((event.turn / event.maxTurns) * 90) + 5));
        }
        if (event.phase === "finished") {
          setProgress(100);
          setStage("优化完成");
        }
      };

      const result = await optimizeResumeWithAgent({
        studentId: studentId,
        originalResume: resumeText,
        targetJob,
        iterations: 3,
        playerStrategy,
        scoreTarget: 85,
        stream: true,
        onTrace: appendTrace,
        onTurn: appendTurn,
      });

      setOptimizeResult(result);
      setLiveTrace(result.reasoningTrace);
      setLiveEngine(result.engine);
      setResumeText(result.optimizedResume);
      setProgress(100);
      setStage("完成");
      setActiveTab("optimize");
      setHint(`模拟得分 ${result.originalScore} → ${result.finalScore}（${result.engine}）`);
    } catch {
      setHint("简历优化 Agent 失败，请检查 API 与 OpenAI 配置。");
    } finally {
      setLoading(false);
      setTimeout(() => setProgress(0), 1200);
    }
  };

  const run = async () => {
    if (!resumeText.trim()) return;
    try {
      const result = await withProgress(
        [
          { label: "抽取简历结构", ms: 900 },
          { label: "匹配岗位关键词", ms: 1000 },
          { label: "生成 HR 评审", ms: 1100 },
        ],
        () =>
          analyzeStudentResume({
            studentId: studentId,
            resumeName,
            resumeText,
            targetJob,
          }),
      );
      setAnalysis(result);
      setActiveTab("analysis");
    } catch {
      setHint("解析失败，请稍后重试。");
    }
  };

  const content = (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[14px] font-semibold text-white">简历分析看板</div>
        <div className="flex rounded-2xl border border-white/10 bg-slate-950/40 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-medium transition-all duration-200",
                activeTab === tab.key
                  ? "bg-cyan-500/20 text-cyan-100"
                  : "text-white/50 hover:bg-white/5 hover:text-white/75",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {activeTab === "input" ? (
          <>
            {snapshot ? (
              <div className="rounded-[16px] border border-white/10 bg-white/5 p-3 text-sm">
                <p className="font-medium text-white/90">最近一次分析</p>
                <p className="text-white/60">
                  {snapshot.resumeName} · {snapshot.targetJob} · 匹配分 {snapshot.fitScore}
                </p>
                <p className="text-white/60">{snapshot.fitSummary}</p>
              </div>
            ) : null}

            <Input
              className="border border-white/10 bg-white/5 text-white file:text-white/80 placeholder:text-white/35 focus-visible:ring-cyan-300/30"
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
            />
            <Input
              className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
              value={resumeName}
              onChange={(e) => setResumeName(e.target.value)}
              placeholder="简历文件名"
            />
            <Input
              className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
              value={targetJob}
              onChange={(e) => setTargetJob(e.target.value)}
              placeholder="目标岗位"
            />
            <Textarea
              className="min-h-[160px] border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="粘贴简历内容，或先上传文件自动提取。"
            />
            {hint ? <p className="text-xs text-white/55">{hint}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={run}
                disabled={loading || !resumeText.trim()}
                className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25"
              >
                {loading ? "解析中..." : "生成匹配分析"}
              </Button>
              <Button
                onClick={() => {
                  setActiveTab("optimize");
                  void runOptimize();
                }}
                disabled={loading || !resumeText.trim()}
                className="bg-cyan-500/15 text-cyan-100/90 hover:bg-cyan-500/20"
              >
                {loading ? "优化中..." : "进入 AI 优化"}
              </Button>
            </div>
          </>
        ) : null}

        {activeTab === "analysis" ? (
          <>
            {!analysis ? (
              <div className="rounded-[16px] border border-dashed border-white/15 bg-white/[0.02] p-6 text-center text-sm text-white/50">
                请先在「简历输入」上传或粘贴简历，并生成匹配分析。
              </div>
            ) : (
              <div className="rounded-[16px] border border-white/10 bg-white/5 p-4 text-sm">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge className="border border-emerald-300/20 bg-emerald-500/10 text-emerald-200">
                    匹配分 {analysis.analysis.fitScore}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white/70">{analysis.targetJob}</Badge>
                </div>
                <p className="leading-relaxed text-white/65">{analysis.analysis.fitSummary}</p>
                {analysis.analysis.highlights?.length ? (
                  <ul className="mt-4 space-y-1 text-white/55">
                    {analysis.analysis.highlights.map((s) => (
                      <li key={s}>亮点：{s}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}
            <Button
              variant="outline"
              className="border-white/10 bg-transparent text-white/70 hover:bg-white/5"
              onClick={() => setActiveTab("input")}
            >
              返回编辑简历
            </Button>
          </>
        ) : null}

        {activeTab === "optimize" ? (
          <>
            <div className="rounded-[16px] border border-white/10 bg-white/5 p-3 text-sm text-white/60">
              目标岗位：<span className="text-white/85">{targetJob || "未填写"}</span>
              {" · "}
              策略：
              <select
                value={playerStrategy}
                onChange={(e) => setPlayerStrategy(e.target.value as typeof playerStrategy)}
                className="ml-1 rounded-md border border-white/10 bg-slate-950/50 px-2 py-0.5 text-white"
              >
                <option value="conservative">稳健</option>
                <option value="aggressive">进取</option>
                <option value="random">随机探索</option>
              </select>
            </div>

            <Button
              onClick={() => void runOptimize()}
              disabled={loading || !resumeText.trim()}
              className="w-full bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25"
            >
              {loading ? "Agent 运行中..." : "启动 AI 简历优化（真实模拟）"}
            </Button>

            {(loading || progress > 0) && (
              <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-white/55">{stage}</p>
                <Progress value={progress} className="mt-2 bg-white/10" />
              </div>
            )}

            {(loading || liveTrace.length > 0) && (
              <AgentReasoningPanel trace={liveTrace} engine={liveEngine} live={loading} />
            )}

            {(loading || autoRunTurns.length > 0) && (
              <AutoRunProgressPanel turns={autoRunTurns} live={loading} />
            )}

            {optimizeResult && !loading ? (
              <div className="space-y-3">
                <div className="rounded-[16px] border border-cyan-400/20 bg-cyan-500/10 p-3 text-sm">
                  <p className="font-medium text-cyan-100">
                    模拟得分 {optimizeResult.originalScore} → {optimizeResult.finalScore}
                  </p>
                  <ul className="mt-2 space-y-1 text-white/65">
                    {optimizeResult.improvementHistory.map((h) => (
                      <li key={h.iteration}>
                        第 {h.iteration} 轮：{h.overallScore} 分
                        {h.weakDimensions.length ? `（薄弱：${h.weakDimensions.join("、")}）` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
                <Textarea
                  readOnly
                  className="min-h-[140px] border border-white/10 bg-white/5 text-white/80"
                  value={optimizeResult.optimizedResume}
                />
              </div>
            ) : null}

            {hint ? <p className="text-xs text-white/55">{hint}</p> : null}
          </>
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div className="px-1 py-1">{content}</div>;

  return <GlassCard className="px-6 py-5">{content}</GlassCard>;
}
