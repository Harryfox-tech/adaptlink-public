import type { AutoRunTurnEvent } from "@/components/simulator/auto-run-progress-panel";
import type { ResumeOptimizeResult } from "@/lib/types";

type StreamHandlers = {
  onTrace?: (line: string) => void;
  onTurn?: (event: AutoRunTurnEvent) => void;
};

function parseResumeResult(data: Record<string, unknown>): ResumeOptimizeResult {
  return {
    optimizedResume: String(data.optimizedResume ?? data.optimized_resume ?? ""),
    originalScore: Number(data.originalScore ?? data.original_score ?? 0),
    finalScore: Number(data.finalScore ?? data.final_score ?? 0),
    improvementHistory: (data.improvementHistory ??
      data.improvement_history ??
      []) as ResumeOptimizeResult["improvementHistory"],
    modificationLog: (data.modificationLog ?? data.modification_log ?? []) as string[],
    suggestedModifications: (data.suggestedModifications ??
      data.suggested_resume_modifications ??
      []) as string[],
    reasoningTrace: (data.reasoningTrace ?? data.reasoning_trace ?? []) as string[],
    engine: String(data.engine ?? "mock"),
  };
}

export async function consumeResumeOptimizeSse(
  res: Response,
  handlers?: StreamHandlers,
): Promise<ResumeOptimizeResult> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `Resume stream failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let result: ResumeOptimizeResult | null = null;

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
      } else if (event === "turn") {
        handlers?.onTurn?.(JSON.parse(dataLine) as AutoRunTurnEvent);
      } else if (event === "result") {
        result = parseResumeResult(JSON.parse(dataLine) as Record<string, unknown>);
      } else if (event === "error") {
        const payload = JSON.parse(dataLine) as { error: string };
        throw new Error(payload.error);
      }
    }
  }

  if (!result) throw new Error("Resume stream ended without result");
  return result;
}

export async function consumeAutoRunSse(
  res: Response,
  handlers?: StreamHandlers,
): Promise<Record<string, unknown>> {
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    throw new Error(err.error ?? err.detail ?? `Auto-run stream failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> | null = null;

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
      } else if (event === "turn") {
        handlers?.onTurn?.(JSON.parse(dataLine) as AutoRunTurnEvent);
      } else if (event === "result") {
        result = JSON.parse(dataLine) as Record<string, unknown>;
      } else if (event === "error") {
        const payload = JSON.parse(dataLine) as { error: string };
        throw new Error(payload.error);
      }
    }
  }

  if (!result) throw new Error("Auto-run stream ended without result");
  return result;
}
