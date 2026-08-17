import { randomUUID } from "crypto";

import { AgentError, newCorrelationId } from "./agent-errors";
import type { AgentActInput, AgentStartInput, AgentStepResult, EpisodeAgentState } from "./types";
import { runSimulationReAct } from "./react-loop";
import { saveAgentState, getAgentState, deleteAgentState } from "./store";
import { agentStateToEpisode } from "./api-backend";
import {
  runBackendAgentAct,
  runBackendAgentStart,
  useBackendLangGraphAgent,
} from "./backend-orchestrator";

function newEpisodeId(simulationType: string) {
  return `ep_agent_${simulationType}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function createInitialState(input: AgentStartInput, correlationId: string): EpisodeAgentState {
  const totalStagesDynamic = 4 + Math.floor(Math.random() * 2);
  return {
    episodeId: newEpisodeId(input.simulationType),
    studentId: input.studentId,
    simulationType: input.simulationType,
    target: input.target,
    currentStage: 1,
    totalStagesDynamic,
    status: "running",
    state: { confidence: 55, pressure: 45, energy: 70, readiness: 50 },
    currentEvent: null,
    dialogue: [],
    turns: [],
    ending: null,
    endingType: null,
    eventHistory: [],
    playerChoices: [],
    longTermMemories: [],
    recalledMemories: [],
    reasoningTrace: [`[ReAct] 启动导演 Agent (${correlationId})`],
    engine: "mock",
    phaseComplete: false,
    lastTurnScore: null,
    lastPlayerChoice: null,
  };
}

function toResult(state: EpisodeAgentState, finished: boolean, endingTriggered: boolean): AgentStepResult {
  return {
    episode: agentStateToEpisode(state),
    finished,
    endingTriggered,
    reasoningTrace: state.reasoningTrace,
    recalledMemories: state.recalledMemories,
    engine: state.engine,
  };
}

export type AgentRunCallbacks = {
  onTraceLine?: (line: string) => void;
};

export async function runAgentStart(
  input: AgentStartInput,
  callbacks?: AgentRunCallbacks,
  token?: string | null,
): Promise<AgentStepResult> {
  if (useBackendLangGraphAgent()) {
    try {
      return await runBackendAgentStart(input, token);
    } catch (e) {
      throw new AgentError(
        e instanceof Error ? e.message : "Backend LangGraph start failed",
        "REACT_FAILED",
        500,
        true,
        newCorrelationId(),
      );
    }
  }

  const correlationId = newCorrelationId();
  const state = createInitialState(input, correlationId);

  try {
    await runSimulationReAct({
      state,
      phase: "start",
      maxSteps: 12,
      onTraceLine: callbacks?.onTraceLine,
    });
  } catch (e) {
    throw new AgentError(
      e instanceof Error ? e.message : "ReAct start failed",
      "REACT_FAILED",
      500,
      true,
      correlationId,
    );
  }

  await saveAgentState(state);
  return toResult(state, false, false);
}

export async function runAgentAct(
  input: AgentActInput,
  callbacks?: AgentRunCallbacks,
  token?: string | null,
): Promise<AgentStepResult> {
  if (useBackendLangGraphAgent()) {
    try {
      return await runBackendAgentAct(input, token);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Backend LangGraph act failed";
      const correlationId = newCorrelationId();
      if (msg.toLowerCase().includes("not found")) {
        throw new AgentError(msg, "EPISODE_NOT_FOUND", 404, false, correlationId);
      }
      if (msg.toLowerCase().includes("completed")) {
        throw new AgentError(msg, "EPISODE_COMPLETED", 409, false, correlationId);
      }
      throw new AgentError(msg, "REACT_FAILED", 500, true, correlationId);
    }
  }

  const correlationId = newCorrelationId();
  const state = await getAgentState(input.episodeId);
  if (!state) {
    throw new AgentError("Episode not found", "EPISODE_NOT_FOUND", 404, false, correlationId);
  }
  if (state.status === "completed") {
    throw new AgentError("Episode already completed", "EPISODE_COMPLETED", 409, false, correlationId);
  }

  const choice = input.choice.trim();
  if (!choice) {
    throw new AgentError("Choice is required", "INVALID_INPUT", 400, false, correlationId);
  }

  state.phaseComplete = false;
  state.reasoningTrace.push(`[ReAct] 处理玩家行动 (${correlationId})`);
  callbacks?.onTraceLine?.(`[ReAct] 处理玩家行动 (${correlationId})`);

  try {
    await runSimulationReAct({
      state,
      phase: "act",
      userChoice: choice,
      maxSteps: 16,
      onTraceLine: callbacks?.onTraceLine,
    });
  } catch (e) {
    throw new AgentError(
      e instanceof Error ? e.message : "ReAct act failed",
      "REACT_FAILED",
      500,
      true,
      correlationId,
    );
  }

  const finished = state.ending != null;
  await saveAgentState(state);
  return toResult(state, finished, finished);
}

export async function clearAgentEpisode(episodeId: string) {
  await deleteAgentState(episodeId);
}
