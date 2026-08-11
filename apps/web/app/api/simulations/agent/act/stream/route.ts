import { runAgentAct } from "@/lib/simulation-agent/orchestrator";
import { agentErrorResponse } from "@/lib/simulation-agent/route-utils";
import {
  proxyBackendAgentActStream,
  useBackendLangGraphAgent,
} from "@/lib/simulation-agent/backend-orchestrator";
import { createAgentSseStream, sseResponse } from "@/lib/simulation-agent/sse";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      episodeId?: string;
      choice?: string;
    };

    if (!body.episodeId || !body.choice?.trim()) {
      return Response.json(
        { error: "缺少 episodeId 或 choice", code: "INVALID_INPUT", retryable: false },
        { status: 400 },
      );
    }

    if (useBackendLangGraphAgent()) {
      const backendRes = await proxyBackendAgentActStream({
        episodeId: body.episodeId,
        choice: body.choice.trim(),
      });
      if (!backendRes.ok || !backendRes.body) {
        const err = (await backendRes.json().catch(() => ({}))) as { detail?: string };
        return Response.json(
          { error: err.detail ?? "Backend agent stream failed", code: "REACT_FAILED", retryable: true },
          { status: backendRes.status || 500 },
        );
      }
      return new Response(backendRes.body, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const stream = createAgentSseStream(async (emit) => {
      const result = await runAgentAct(
        { episodeId: body.episodeId!, choice: body.choice!.trim() },
        { onTraceLine: (line) => emit({ type: "trace", line }) },
      );
      emit({ type: "result", data: result });
    });

    return sseResponse(stream);
  } catch (e) {
    return agentErrorResponse(e);
  }
}
