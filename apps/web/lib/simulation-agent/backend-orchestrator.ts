import type { AgentActInput, AgentStartInput, AgentStepResult } from "./types";

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/$/, "");
}

type BackendAgentResult = {
  episode: AgentStepResult["episode"];
  finished: boolean;
  endingTriggered: boolean;
  reasoningTrace: string[];
  recalledMemories: AgentStepResult["recalledMemories"];
  engine: string;
};

export function useBackendLangGraphAgent(): boolean {
  const engine = process.env.SIMULATION_AGENT_ENGINE ?? "langgraph";
  return engine !== "next";
}

function authHeaders(token?: string | null): Record<string, string> {
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function runBackendAgentStart(input: AgentStartInput, token?: string | null): Promise<AgentStepResult> {
  const res = await fetch(`${apiBase()}/simulations/agent/start`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      student_id: input.studentId,
      simulation_type: input.simulationType,
      target: input.target,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(err.detail ?? err.error ?? `Backend agent start failed: ${res.status}`);
  }
  return (await res.json()) as BackendAgentResult;
}

export async function runBackendAgentAct(input: AgentActInput, token?: string | null): Promise<AgentStepResult> {
  const res = await fetch(`${apiBase()}/simulations/agent/act`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      episode_id: input.episodeId,
      choice: input.choice,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string; error?: string };
    throw new Error(err.detail ?? err.error ?? `Backend agent act failed: ${res.status}`);
  }
  return (await res.json()) as BackendAgentResult;
}

export async function proxyBackendAgentStartStream(
  body: {
    studentId: string;
    simulationType: "growth" | "job";
    target: string;
  },
  token?: string | null,
): Promise<Response> {
  const res = await fetch(`${apiBase()}/simulations/agent/start/stream`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      student_id: body.studentId,
      simulation_type: body.simulationType,
      target: body.target,
    }),
    cache: "no-store",
  });
  return res;
}

export async function proxyBackendAgentActStream(
  body: {
    episodeId: string;
    choice: string;
  },
  token?: string | null,
): Promise<Response> {
  const res = await fetch(`${apiBase()}/simulations/agent/act/stream`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({
      episode_id: body.episodeId,
      choice: body.choice,
    }),
    cache: "no-store",
  });
  return res;
}
