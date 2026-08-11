import { generateText, tool } from "ai";
import { z } from "zod";

import type { ResumeOptimizerAgentState } from "./state";
import { getAgentModel, hasAgentLlm } from "@/lib/simulation-agent/model";

function apiBase() {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/$/, "");
}

function obs(data: Record<string, unknown>) {
  return JSON.stringify(data);
}

async function callAutoRun(state: ResumeOptimizerAgentState) {
  const res = await fetch(`${apiBase()}/simulations/auto-run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: state.studentId,
      resume_content: state.currentResume,
      target_job: state.targetJob,
      simulation_type: "job",
      player_strategy: state.playerStrategy,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<{
    overall_score: number;
    weak_dimensions: string[];
    suggested_resume_modifications: string[];
    engine: string;
  }>;
}

async function implRunSimulation(state: ResumeOptimizerAgentState) {
  if (state.iterationCount >= state.iterationsMax) {
    return obs({ ok: false, error: "已达最大迭代次数", iterationCount: state.iterationCount });
  }

  state.iterationCount += 1;
  const result = await callAutoRun(state);
  if (result.engine === "openai") state.engine = "openai";

  if (state.originalScore === null) state.originalScore = result.overall_score;
  if (result.overall_score > state.bestScore) {
    state.bestScore = result.overall_score;
    state.bestResume = state.currentResume;
  }

  state.lastWeakDimensions = result.weak_dimensions;
  state.lastSuggestions = result.suggested_resume_modifications;

  state.history.push({
    iteration: state.iterationCount,
    overallScore: result.overall_score,
    weakDimensions: result.weak_dimensions,
    resumePreview: state.currentResume.slice(0, 120),
  });

  return obs({
    ok: true,
    iteration: state.iterationCount,
    overallScore: result.overall_score,
    bestScore: state.bestScore,
    scoreTarget: state.scoreTarget,
    weakDimensions: result.weak_dimensions,
    suggestions: result.suggested_resume_modifications,
  });
}

async function implRewriteResume(state: ResumeOptimizerAgentState, focus: string) {
  const model = getAgentModel();
  const suggestions = state.lastSuggestions.length ? state.lastSuggestions : [focus];

  if (model && hasAgentLlm()) {
    try {
      const { text } = await generateText({
        model,
        system: "你是简历优化专家。输出修改后的完整简历正文，不要 Markdown 包裹。",
        prompt: `岗位：${state.targetJob}\n薄弱项：${state.lastWeakDimensions.join("、")}\n建议：${suggestions.join("；")}\n\n原简历：\n${state.currentResume.slice(0, 3500)}`,
        maxTokens: 2000,
      });
      if (text.trim()) {
        state.currentResume = text.trim();
        state.modificationLog.push(`第${state.iterationCount}轮：LLM 改写简历`);
        state.engine = "openai";
        return obs({ ok: true, chars: state.currentResume.length, preview: state.currentResume.slice(0, 200) });
      }
    } catch (e) {
      state.modificationLog.push(`改写失败：${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  const addition = `\n\n【ReAct优化·第${state.iterationCount}轮】针对「${focus || state.lastWeakDimensions[0] || state.targetJob}」补充量化成果与岗位关键词。`;
  if (!state.currentResume.includes(addition.trim())) {
    state.currentResume = state.currentResume.trim() + addition;
  }
  state.modificationLog.push(`第${state.iterationCount}轮：规则追加段落`);
  return obs({ ok: true, mock: true, chars: state.currentResume.length });
}

export function implCompareProgress(state: ResumeOptimizerAgentState) {
  return obs({
    originalScore: state.originalScore,
    bestScore: state.bestScore,
    currentScore: state.history[state.history.length - 1]?.overallScore ?? 0,
    scoreTarget: state.scoreTarget,
    iterationsUsed: state.iterationCount,
    iterationsMax: state.iterationsMax,
    shouldStop: state.bestScore >= state.scoreTarget || state.iterationCount >= state.iterationsMax,
  });
}

export function implFinishOptimization(state: ResumeOptimizerAgentState, summary: string) {
  state.done = true;
  state.currentResume = state.bestResume;
  state.modificationLog.push(`完成：${summary}`);
  return obs({
    ok: true,
    optimizedResumeChars: state.currentResume.length,
    originalScore: state.originalScore,
    finalScore: state.bestScore,
    summary,
  });
}

export function createResumeOptimizerTools(state: ResumeOptimizerAgentState) {
  return {
    runJobSimulation: tool({
      description: "用当前简历自动跑完一局求职剧情模拟，返回得分与薄弱项（每次迭代至少调用一次）",
      parameters: z.object({}),
      execute: async () => implRunSimulation(state),
    }),

    rewriteResume: tool({
      description: "根据上一轮模拟暴露的薄弱项改写简历全文",
      parameters: z.object({
        focus: z.string().describe("本轮改写重点，如「岗位匹配」「量化成果」"),
      }),
      execute: async ({ focus }) => implRewriteResume(state, focus),
    }),

    compareProgress: tool({
      description: "查看当前得分进度，判断是否已达目标或应用尽迭代次数",
      parameters: z.object({}),
      execute: async () => implCompareProgress(state),
    }),

    finishOptimization: tool({
      description: "结束优化并输出最终简历（在达标或无法再提升时调用）",
      parameters: z.object({
        summary: z.string().describe("给用户的简短总结"),
      }),
      execute: async ({ summary }) => implFinishOptimization(state, summary),
    }),
  };
}

export async function runResumeOptimizerMockFallback(state: ResumeOptimizerAgentState) {
  state.reasoningTrace.push("[ReAct] Mock：无 OPENAI_API_KEY，单轮模拟后结束");
  await implRunSimulation(state);
  implFinishOptimization(state, "Mock 模式仅执行一轮自动模拟");
}
