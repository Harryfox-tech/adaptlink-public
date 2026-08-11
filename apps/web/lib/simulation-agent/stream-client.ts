import type { AgentStepResult } from "./types";

type SseHandlers = {
  onTrace?: (line: string) => void;
};

async function consumeAgentSse(res: Response, handlers?: SseHandlers): Promise<AgentStepResult> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as {
      error?: string;
      code?: string;
      retryable?: boolean;
    };
    throw new Error(err.error ?? `Agent stream failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let result: AgentStepResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const lines = part.split("\n");
      let event = "message";
      let dataLine = "";
      for (const line of lines) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }
      if (!dataLine) continue;

      if (event === "trace") {
        const payload = JSON.parse(dataLine) as { line: string };
        handlers?.onTrace?.(payload.line);
      } else if (event === "result") {
        result = JSON.parse(dataLine) as AgentStepResult;
      } else if (event === "error") {
        const payload = JSON.parse(dataLine) as { error: string };
        throw new Error(payload.error);
      }
    }
  }

  if (!result) {
    throw new Error("Agent stream ended without result");
  }
  return result;
}

export async function startSimulationAgentStream(
  input: {
    studentId: string;
    simulationType: "growth" | "job";
    target: string;
  },
  handlers?: SseHandlers,
): Promise<AgentStepResult> {
  const res = await fetch("/api/simulations/agent/start/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  return consumeAgentSse(res, handlers);
}

export async function actSimulationAgentStream(
  episodeId: string,
  choice: string,
  handlers?: SseHandlers,
): Promise<AgentStepResult> {
  const res = await fetch("/api/simulations/agent/act/stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ episodeId, choice }),
    cache: "no-store",
  });
  return consumeAgentSse(res, handlers);
}
