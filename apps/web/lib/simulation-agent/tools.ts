import { generateObject, tool } from "ai";
import { z } from "zod";

import type { EpisodeAgentState } from "./types";
import type { EpisodeEvent, SimulationResult } from "@/lib/types";
import {
  checkEndingOnBackend,
  persistEpisodeOnBackend,
  recallMemoriesFromBackend,
  runSimulationOnBackend,
  storeMemoryOnBackend,
} from "./api-backend";
import { agentStateToEpisode } from "./api-backend";
import { getAgentModel, hasAgentLlm } from "./model";
import { toolErr, toolOk } from "./agent-errors";

const eventSchema = z.object({
  title: z.string(),
  description: z.string(),
  choices: z.array(z.string()).min(2).max(5),
  npc_role: z.string(),
  npc_goal: z.string(),
  opening_line: z.string(),
});

function nowIso() {
  return new Date().toISOString();
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function obs(data: Record<string, unknown>) {
  if (data.ok === false) {
    return toolErr(String(data.errorCode ?? "TOOL_ERROR"), String(data.error ?? "unknown"), Boolean(data.retryable ?? true), data);
  }
  return toolOk(data);
}

export async function implRetrieveMemories(state: EpisodeAgentState) {
  try {
    const res = await recallMemoriesFromBackend(state.studentId, state.target, 3);
    const items = res.items.map((m) => ({
      memoryId: m.memory_id,
      text: m.text,
      reflectedInStory: false,
    }));
    state.recalledMemories = items;
    state.longTermMemories = items;
    return obs({ ok: true, count: items.length, memories: items.map((m) => m.text) });
  } catch (e) {
    state.reasoningTrace.push(
      `[warn] retrieveMemories: ${e instanceof Error ? e.message : "backend unavailable"}`,
    );
    const fallback = [
      {
        memoryId: `local_${state.studentId}`,
        text: "你曾在团队协作中展现过主动担责的一面。",
        reflectedInStory: false,
      },
    ];
    state.recalledMemories = fallback;
    state.longTermMemories = fallback;
    return obs({ ok: true, mock: true, count: 1, memories: [fallback[0].text] });
  }
}

export async function implGenerateEvent(state: EpisodeAgentState) {
  const memoryHint =
    state.recalledMemories.length > 0
      ? state.recalledMemories.map((m) => m.text).join("；")
      : "";

  const model = getAgentModel();
  if (model && hasAgentLlm()) {
    try {
      const { object } = await generateObject({
        model,
        schema: eventSchema,
        system: "你是剧情导演。输出下一幕事件 JSON。",
        prompt: `类型:${state.simulationType} 目标:${state.target} 幕:${state.currentStage}/${state.totalStagesDynamic} 状态:${JSON.stringify(state.state)} 记忆:${memoryHint}`,
      });
      const event: EpisodeEvent = {
        id: `ev_${state.episodeId}_${state.currentStage}`,
        stage: state.currentStage,
        title: object.title,
        description: object.description,
        choices: object.choices,
        npcRole: object.npc_role,
        npcGoal: object.npc_goal,
        openingLine: object.opening_line,
      };
      state.currentEvent = event;
      state.eventHistory.push(object.title);
      state.dialogue = [{ speaker: "npc", content: object.opening_line, timestamp: nowIso() }];
      state.recalledMemories = state.recalledMemories.map((m) => ({ ...m, reflectedInStory: true }));
      state.engine = "openai";
      return obs({
        ok: true,
        eventTitle: event.title,
        choices: event.choices,
        openingLine: event.openingLine,
      });
    } catch (e) {
      state.reasoningTrace.push(`generateEvent llm error: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  const titles =
    state.simulationType === "job"
      ? ["压力追问", "业务案例深挖", "团队协作冲突", "终面复盘"]
      : ["资源冲突", "团队分歧", "进度失控", "成果答辩"];
  const title = titles[Math.min(state.currentStage - 1, titles.length - 1)] ?? "关键抉择";
  const event: EpisodeEvent = {
    id: `ev_${state.episodeId}_${state.currentStage}`,
    stage: state.currentStage,
    title,
    description: `第 ${state.currentStage} 幕：围绕目标出现新局面。`,
    choices: ["先澄清目标与边界", "主动承担并给出方案", "寻求同伴支持后推进", "暂缓并收集更多信息"],
    npcRole: state.simulationType === "job" ? "面试官" : "导师",
    npcGoal: "检验结构化表达与抗压",
    openingLine: `面对「${title}」，你的第一步是什么？`,
  };
  state.currentEvent = event;
  state.eventHistory.push(title);
  state.dialogue = [{ speaker: "npc", content: event.openingLine, timestamp: nowIso() }];
  state.engine = "mock";
  return obs({ ok: true, mock: true, eventTitle: title, choices: event.choices });
}

async function implEvaluatePlayerChoice(state: EpisodeAgentState, choice: string) {
  state.lastPlayerChoice = choice;
  const scene = state.currentEvent
    ? `${state.currentEvent.title} | ${state.currentEvent.description}`
    : state.target;

  let result: SimulationResult;
  try {
    const res = await runSimulationOnBackend({
      studentId: state.studentId,
      simulationType: state.simulationType,
      scene,
      targetJob: state.simulationType === "job" ? state.target : undefined,
      messages: [{ role: "user", content: choice }],
    });
    const agg = res.aggregate;
    result = {
      sessionId: agg.session_id,
      simulationType: agg.simulation_type as "growth" | "job",
      overallScore: agg.overall_score,
      summary: agg.summary,
      recommendations: agg.recommendations,
      abilityScores: agg.ability_scores.map((a) => ({
        key: a.key,
        label: a.label,
        score: a.score,
        trend: a.trend as "up" | "flat" | "down",
      })),
      agentReviews: agg.agent_reviews.map((r) => ({
        agent: r.agent,
        score: r.score,
        summary: r.summary,
        highlights: r.highlights,
      })),
      jobMatches: agg.job_recommendations.map((j) => ({
        jobId: j.job_id,
        title: j.title,
        company: j.company,
        matchScore: j.match_score,
        reasons: j.reasons,
      })),
    };
    if (res.engine === "openai") state.engine = "openai";
  } catch (e) {
    state.reasoningTrace.push(
      `[warn] evaluatePlayerChoice: ${e instanceof Error ? e.message : "backend unavailable"}, using mock score`,
    );
    result = {
      sessionId: `mock_${Date.now()}`,
      simulationType: state.simulationType,
      overallScore: 72,
      summary: "Mock 评估",
      recommendations: [],
      abilityScores: [],
      agentReviews: [],
      jobMatches: [],
    };
  }

  const score = result.overallScore;
  state.lastTurnScore = score;
  const delta = (score - 70) / 5;
  state.state = {
    confidence: clamp(state.state.confidence + delta + (choice.length > 40 ? 2 : 0)),
    pressure: clamp(state.state.pressure - delta / 2 + (score < 65 ? 4 : -2)),
    energy: clamp(state.state.energy - 3),
    readiness: clamp(state.state.readiness + delta),
  };
  state.playerChoices.push(choice);
  state.dialogue.push({ speaker: "user", content: choice, timestamp: nowIso() });
  state.turns.push({
    turn: state.turns.length + 1,
    choice,
    aggregate: result,
    stateAfter: { ...state.state },
    narrative: `第 ${state.currentStage} 幕：选择「${choice.slice(0, 80)}」，得分 ${score}`,
    engine: state.engine,
  });

  return obs({
    ok: true,
    overallScore: score,
    state: state.state,
    weakAbilities: result.abilityScores.filter((a) => a.score < 72).map((a) => a.label),
    summary: result.summary,
  });
}

async function implCheckEnding(state: EpisodeAgentState) {
  const episode = agentStateToEpisode(state);
  try {
    const res = await checkEndingOnBackend(episode);
    if (res.triggered && res.ending) {
      state.status = "completed";
      state.currentEvent = null;
      state.endingType = res.ending_type;
      state.ending = {
        code: res.ending.code,
        title: res.ending.title,
        summary: res.ending.summary,
        nextSteps: res.ending.next_steps,
      };
      return obs({
        triggered: true,
        endingType: res.ending_type,
        endingTitle: res.ending.title,
        endingSummary: res.ending.summary,
      });
    }
    return obs({ triggered: false, reason: "条件未满足，可继续剧情" });
  } catch (e) {
    state.reasoningTrace.push(
      `[warn] checkEnding: ${e instanceof Error ? e.message : "backend unavailable"}`,
    );
    if (state.currentStage >= state.totalStagesDynamic) {
      state.status = "completed";
      state.endingType = "neutral";
      state.ending = {
        code: "NEUTRAL_END",
        title: "平稳收官",
        summary: "完成剧情线。",
        nextSteps: ["复盘", "再练一轮"],
      };
      state.currentEvent = null;
      return obs({ triggered: true, endingType: "neutral", mock: true });
    }
    return obs({ triggered: false });
  }
}

function implAdvanceStage(state: EpisodeAgentState) {
  if (state.status === "completed") {
    return obs({
      ok: false,
      errorCode: "EPISODE_COMPLETED",
      error: "episode already completed",
      retryable: false,
    });
  }
  state.currentStage += 1;
  return obs({ ok: true, currentStage: state.currentStage, total: state.totalStagesDynamic });
}

async function implFinalizeEpisode(state: EpisodeAgentState) {
  if (state.ending) {
    try {
      await storeMemoryOnBackend({
        studentId: state.studentId,
        memoryText: state.ending.summary,
        keywords: [state.simulationType, state.endingType ?? "end"],
        importance: 8,
        episodeId: state.episodeId,
      });
    } catch {
      /* ignore */
    }
  }
  try {
    await persistEpisodeOnBackend(agentStateToEpisode(state), state.endingType, state.reasoningTrace);
  } catch {
    /* ignore */
  }
  return obs({ ok: true, status: state.status, ending: state.ending?.title ?? null });
}

export function implWaitForUserInput(state: EpisodeAgentState, reason: string) {
  state.phaseComplete = true;
  return obs({ ok: true, waiting: true, reason, hasEvent: Boolean(state.currentEvent) });
}

/** 供 ReAct 循环调用的工具集（LLM 自主择序） */
export function createSimulationTools(state: EpisodeAgentState) {
  return {
    retrieveMemories: tool({
      description: "从长期记忆库检索与本局相关的过往经历，供剧情引用",
      parameters: z.object({}),
      execute: async () => implRetrieveMemories(state),
    }),

    generateEvent: tool({
      description: "生成当前幕的剧情事件（标题、描述、选项、NPC 开场白）",
      parameters: z.object({
        narrativeFocus: z.string().optional().describe("本幕叙事重点"),
      }),
      execute: async () => implGenerateEvent(state),
    }),

    evaluatePlayerChoice: tool({
      description: "评估玩家本轮选择，更新四维状态并记录回合结果",
      parameters: z.object({
        choice: z.string().describe("玩家本轮选择或回答原文"),
      }),
      execute: async ({ choice }) => implEvaluatePlayerChoice(state, choice),
    }),

    checkEnding: tool({
      description: "检查是否满足动态结局条件",
      parameters: z.object({}),
      execute: async () => implCheckEnding(state),
    }),

    advanceStage: tool({
      description: "未结局时进入下一幕（仅调用一次）",
      parameters: z.object({}),
      execute: async () => implAdvanceStage(state),
    }),

    finalizeEpisode: tool({
      description: "结局已触发时：写入长期记忆并持久化 episode",
      parameters: z.object({}),
      execute: async () => implFinalizeEpisode(state),
    }),

    waitForUserInput: tool({
      description: "本阶段 ReAct 结束，等待用户在 UI 操作（必须作为最后一步调用）",
      parameters: z.object({
        reason: z.string().describe("为何可以等待用户"),
      }),
      execute: async ({ reason }) => implWaitForUserInput(state, reason),
    }),
  };
}

/** 无 LLM 时：工具与 Observation 格式不变，仅无法由模型自主择序 */
export async function runMockReActFallback(
  state: EpisodeAgentState,
  phase: "start" | "act",
  userChoice?: string,
) {
  state.reasoningTrace.push("[ReAct] Mock：未配置 OPENAI_API_KEY，无法运行 LLM 择序 ReAct");

  if (phase === "start") {
    state.reasoningTrace.push("[Observation] 需配置 OPENAI_API_KEY 以启用真 ReAct");
    await implRetrieveMemories(state);
    await implGenerateEvent(state);
    implWaitForUserInput(state, "mock-fallback");
    return;
  }

  const choice = userChoice?.trim() || "继续推进";
  await implEvaluatePlayerChoice(state, choice);
  const endingObs = await implCheckEnding(state);
  const parsed = JSON.parse(endingObs) as { triggered?: boolean };
  if (parsed.triggered) {
    await implFinalizeEpisode(state);
  } else {
    implAdvanceStage(state);
    await implGenerateEvent(state);
  }
  implWaitForUserInput(state, "mock-fallback");
}
