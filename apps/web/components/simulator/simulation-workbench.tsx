"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { runSimulation } from "@/lib/api/client";
import { SimulationMessage, SimulationResult, SimulationType } from "@/lib/types";
import { AbilityScoreCards } from "@/components/charts/ability-score-cards";
import { AgentReviewList } from "@/components/simulator/agent-review-list";
import { ChatPanel } from "@/components/simulator/chat-panel";
import { JobRecommendationList } from "@/components/simulator/job-recommendation-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStudentSession } from "@/components/student/student-session-provider";

type ProgressMeta = {
  active: boolean;
  value: number;
  stage: string;
};

export function SimulationWorkbench({
  title,
  description,
  tags,
  simulationType,
  initialResult,
  starterMessages,
  defaultScene,
  defaultAnswer,
  defaultTargetJob,
}: {
  title: string;
  description: string;
  tags: string[];
  simulationType: SimulationType;
  initialResult: SimulationResult;
  starterMessages: SimulationMessage[];
  defaultScene: string;
  defaultAnswer: string;
  defaultTargetJob?: string;
}) {
  const { studentId } = useStudentSession();
  const [scene, setScene] = useState(defaultScene);
  const [answer, setAnswer] = useState(defaultAnswer);
  const [targetJob, setTargetJob] = useState(defaultTargetJob ?? "");
  const [result, setResult] = useState<SimulationResult>(initialResult);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressMeta>({ active: false, value: 0, stage: "等待执行" });

  const withProgress = async <T,>(task: () => Promise<T>) => {
    setLoading(true);
    setProgress({ active: true, value: 8, stage: "准备场景输入" });
    const started = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const value = Math.min(95, Math.max(8, Math.round((elapsed / 2800) * 95)));
      const stage = elapsed < 900 ? "准备场景输入" : elapsed < 1900 ? "AI 生成评估中" : "整理结果结构";
      setProgress({ active: true, value, stage });
    }, 120);

    try {
      const output = await task();
      setProgress({ active: true, value: 100, stage: "已完成" });
      return output;
    } finally {
      clearInterval(timer);
      setLoading(false);
      setTimeout(() => setProgress({ active: false, value: 0, stage: "等待执行" }), 900);
    }
  };

  const run = async () => {
    if (!answer.trim()) return;
    const next = await withProgress(() =>
      runSimulation({
        studentId,
        simulationType,
        scene,
        answer,
        targetJob: simulationType === "job" ? targetJob : undefined,
      }),
    );
    setResult(next);
  };

  return (
    <div className="space-y-4">
      <section className="mb-6 space-y-3 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="text-[14px] leading-[22px] text-white/65">{description}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      </section>

      {(loading || progress.active) && (
        <Card className="border-cyan-500/20 bg-slate-950/40 backdrop-blur-md">
          <CardContent className="space-y-2 pt-4">
            <p className="font-mono text-xs text-cyan-200/70">{progress.stage}</p>
            <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 transition-all duration-300"
                style={{ width: `${progress.value}%` }}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        <ChatPanel title="场景对话" messages={starterMessages} />
        {simulationType === "job" && result.jobMatches?.length ? (
          <JobRecommendationList jobs={result.jobMatches} />
        ) : (
          <Card className="border-white/10 bg-slate-950/35 backdrop-blur-xl">
            <CardHeader>
              <CardTitle>摘要与建议</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-white/60">
              <p>
                <span className="font-mono text-cyan-200/80">综合得分：</span>
                {result.overallScore}
              </p>
              <p>{result.summary}</p>
              {result.recommendations.map((item) => (
                <p key={item}>- {item}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="overflow-hidden border-cyan-500/30 bg-slate-900/40 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
        <CardHeader className="border-b border-white/[0.06]">
          <CardTitle className="font-mono text-sm uppercase tracking-[0.2em] text-cyan-200/80">运行模拟</CardTitle>
          <p className="text-xs font-normal text-white/45">控制台输入 · 提交后生成多智能体评估</p>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          <Input value={scene} onChange={(event) => setScene(event.target.value)} placeholder="输入模拟场景" />
          {simulationType === "job" ? (
            <Input value={targetJob} onChange={(event) => setTargetJob(event.target.value)} placeholder="目标岗位" />
          ) : null}
          <Textarea
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="输入你的回答"
            className="neo-energy-input min-h-[120px] font-mono text-sm"
          />
          <motion.div whileTap={{ scale: 0.98 }} className="inline-block">
            <Button onClick={run} disabled={loading} className="shadow-[0_0_22px_rgba(34,211,238,0.2)]">
              {loading ? "生成中..." : "提交并生成评估"}
            </Button>
          </motion.div>
        </CardContent>
      </Card>

      <AbilityScoreCards abilities={result.abilityScores} />
      <AgentReviewList reviews={result.agentReviews} />
      {simulationType === "job" && result.jobMatches?.length ? <JobRecommendationList jobs={result.jobMatches} /> : null}
    </div>
  );
}
