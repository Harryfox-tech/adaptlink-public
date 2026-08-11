import type { AgentStepResult } from "./types";

export type AgentSseEvent =
  | { type: "trace"; line: string }
  | { type: "result"; data: AgentStepResult }
  | { type: "error"; error: string; code?: string; retryable?: boolean; correlationId?: string };

export function createAgentSseStream(
  run: (emit: (event: AgentSseEvent) => void) => Promise<void>,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const send = (event: AgentSseEvent) => {
        const name = event.type;
        const payload =
          event.type === "trace"
            ? { line: event.line }
            : event.type === "result"
              ? event.data
              : {
                  error: event.error,
                  code: event.code,
                  retryable: event.retryable,
                  correlationId: event.correlationId,
                };
        controller.enqueue(
          encoder.encode(`event: ${name}\ndata: ${JSON.stringify(payload)}\n\n`),
        );
      };

      try {
        await run(send);
      } catch (e) {
        const message = e instanceof Error ? e.message : "Agent failed";
        const code =
          e && typeof e === "object" && "code" in e ? String((e as { code: string }).code) : "REACT_FAILED";
        const retryable =
          e && typeof e === "object" && "retryable" in e
            ? Boolean((e as { retryable: boolean }).retryable)
            : false;
        const correlationId =
          e && typeof e === "object" && "correlationId" in e
            ? String((e as { correlationId: string }).correlationId)
            : undefined;
        send({ type: "error", error: message, code, retryable, correlationId });
      } finally {
        controller.close();
      }
    },
  });
}

export function sseResponse(stream: ReadableStream<Uint8Array>): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
