import type { EpisodeAgentState } from "./types";
import type { SimulationEpisode } from "@/lib/types";

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/$/, "");
}

async function backendFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Backend error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function recallMemoriesFromBackend(studentId: string, context: string, limit = 3) {
  const q = new URLSearchParams({ student_id: studentId, limit: String(limit), context });
  return backendFetch<{ items: { memory_id: string; text: string; reflected_in_story: boolean }[] }>(
    `/simulations/memories/recall?${q}`,
  );
}

export async function storeMemoryOnBackend(input: {
  studentId: string;
  memoryText: string;
  keywords?: string[];
  importance?: number;
  episodeId?: string;
}) {
  return backendFetch<{ memory_id: string }>("/simulations/memories", {
    method: "POST",
    body: JSON.stringify({
      student_id: input.studentId,
      memory_text: input.memoryText,
      keywords: input.keywords ?? [],
      importance: input.importance ?? 5,
      episode_id: input.episodeId,
    }),
  });
}

export async function checkEndingOnBackend(episode: SimulationEpisode) {
  return backendFetch<{
    triggered: boolean;
    ending_type: string | null;
    ending: {
      code: string;
      title: string;
      summary: string;
      next_steps: string[];
    } | null;
  }>("/simulations/episode/check-ending", {
    method: "POST",
    body: JSON.stringify(toApiEpisode(episode)),
  });
}

export async function runSimulationOnBackend(input: {
  studentId: string;
  simulationType: "growth" | "job";
  scene: string;
  targetJob?: string;
  messages: { role: string; content: string }[];
}) {
  return backendFetch<{
    aggregate: {
      session_id: string;
      simulation_type: string;
      overall_score: number;
      summary: string;
      recommendations: string[];
      ability_scores: { key: string; label: string; score: number; trend: string }[];
      agent_reviews: { agent: string; score: number; summary: string; highlights: string[] }[];
      job_recommendations: {
        job_id: string;
        title: string;
        company: string;
        match_score: number;
        reasons: string[];
      }[];
    };
    engine: string;
  }>("/simulations/run", {
    method: "POST",
    body: JSON.stringify({
      student_id: input.studentId,
      simulation_type: input.simulationType,
      scene: input.scene,
      target_job: input.targetJob,
      messages: input.messages,
    }),
  });
}

export async function persistEpisodeOnBackend(
  episode: SimulationEpisode,
  endingType: string | null,
  agentTrace: string[],
) {
  return backendFetch<{ ok: boolean }>("/simulations/episode/persist", {
    method: "POST",
    body: JSON.stringify({
      episode: toApiEpisode(episode),
      ending_type: endingType,
      agent_trace: agentTrace,
    }),
  });
}

export function toApiEpisode(episode: SimulationEpisode) {
  return {
    episode_id: episode.episodeId,
    student_id: episode.studentId,
    simulation_type: episode.simulationType,
    target: episode.target,
    total_stages: episode.totalStages,
    current_stage: episode.currentStage,
    status: episode.status,
    state: episode.state,
    current_event: episode.currentEvent
      ? {
          id: episode.currentEvent.id,
          stage: episode.currentEvent.stage,
          title: episode.currentEvent.title,
          description: episode.currentEvent.description,
          choices: episode.currentEvent.choices,
          npc_role: episode.currentEvent.npcRole,
          npc_goal: episode.currentEvent.npcGoal,
          opening_line: episode.currentEvent.openingLine,
        }
      : null,
    dialogue: episode.dialogue.map((d) => ({
      speaker: d.speaker,
      content: d.content,
      timestamp: d.timestamp,
    })),
    turns: episode.turns.map((t) => ({
      turn: t.turn,
      choice: t.choice,
      aggregate: {
        session_id: t.aggregate.sessionId,
        simulation_type: t.aggregate.simulationType,
        overall_score: t.aggregate.overallScore,
        summary: t.aggregate.summary,
        recommendations: t.aggregate.recommendations,
        ability_scores: t.aggregate.abilityScores,
        agent_reviews: t.aggregate.agentReviews.map((r) => ({
          agent: r.agent,
          score: r.score,
          summary: r.summary,
          highlights: r.highlights,
        })),
        job_recommendations: (t.aggregate.jobMatches ?? []).map((j) => ({
          job_id: j.jobId,
          title: j.title,
          company: j.company,
          match_score: j.matchScore,
          reasons: j.reasons,
        })),
      },
      state_after: t.stateAfter,
      narrative: t.narrative,
      engine: t.engine,
      fallback_reason: t.fallbackReason,
    })),
    ending: episode.ending
      ? {
          code: episode.ending.code,
          title: episode.ending.title,
          summary: episode.ending.summary,
          next_steps: episode.ending.nextSteps,
        }
      : null,
    recalled_memories: (episode.recalledMemories ?? []).map((m) => ({
      memory_id: m.memoryId,
      text: m.text,
      reflected_in_story: m.reflectedInStory,
    })),
    ending_type: episode.endingType,
    total_stages_dynamic: episode.totalStagesDynamic,
    reasoning_trace: episode.reasoningTrace ?? [],
  };
}

export async function persistAgentStateToBackend(state: EpisodeAgentState) {
  return backendFetch<{ persisted: boolean; episode_id: string }>("/simulations/agent-state", {
    method: "PUT",
    body: JSON.stringify({
      episode_id: state.episodeId,
      student_id: state.studentId,
      agent_type: "storyline",
      state,
    }),
  });
}

export async function loadAgentStateFromBackend(episodeId: string): Promise<EpisodeAgentState | null> {
  try {
    const res = await backendFetch<{
      episode_id: string;
      state: EpisodeAgentState;
      persisted: boolean;
    }>(`/simulations/agent-state/${encodeURIComponent(episodeId)}`);
    return res.state ?? null;
  } catch {
    return null;
  }
}

export async function removeAgentStateOnBackend(episodeId: string) {
  return backendFetch<{ ok: boolean }>(`/simulations/agent-state/${encodeURIComponent(episodeId)}`, {
    method: "DELETE",
  });
}

export function agentStateToEpisode(state: EpisodeAgentState): SimulationEpisode {
  return {
    episodeId: state.episodeId,
    studentId: state.studentId,
    simulationType: state.simulationType,
    target: state.target,
    totalStages: state.totalStagesDynamic,
    currentStage: state.currentStage,
    status: state.status,
    state: state.state,
    currentEvent: state.currentEvent,
    dialogue: state.dialogue,
    turns: state.turns,
    ending: state.ending,
    recalledMemories: state.recalledMemories,
    endingType: state.endingType,
    totalStagesDynamic: state.totalStagesDynamic,
    reasoningTrace: state.reasoningTrace,
  };
}
