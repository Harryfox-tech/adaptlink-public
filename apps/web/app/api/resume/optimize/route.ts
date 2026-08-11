import { NextResponse } from "next/server";
import { runResumeOptimizerAgent } from "@/lib/resume-optimizer-agent/orchestrator";
import { proxyBackendResumeStream, useBackendResumeAgent } from "@/lib/resume-optimizer-agent/backend-orchestrator";

export const runtime = "nodejs";
export const maxDuration = 120;

async function consumeResumeSse(res: Response) {
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
      if (event === "result" && dataLine) result = JSON.parse(dataLine) as Record<string, unknown>;
      if (event === "error" && dataLine) {
        const err = JSON.parse(dataLine) as { error?: string };
        throw new Error(err.error ?? "Resume agent stream error");
      }
    }
  }
  if (!result) throw new Error("Resume stream ended without result");
  return result;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      originalResume?: string;
      targetJob?: string;
      iterations?: number;
      playerStrategy?: "conservative" | "aggressive" | "random";
      scoreTarget?: number;
      stream?: boolean;
    };

    if (!body.studentId || !body.originalResume?.trim() || !body.targetJob?.trim()) {
      return NextResponse.json({ error: "缺少 studentId、originalResume 或 targetJob" }, { status: 400 });
    }

    const input = {
      studentId: body.studentId,
      originalResume: body.originalResume.trim(),
      targetJob: body.targetJob.trim(),
      iterations: body.iterations,
      playerStrategy: body.playerStrategy,
      scoreTarget: body.scoreTarget,
    };

    if (useBackendResumeAgent() && body.stream !== false) {
      const backendRes = await proxyBackendResumeStream(input);
      if (!backendRes.ok) {
        const err = (await backendRes.json().catch(() => ({}))) as { detail?: string };
        return NextResponse.json({ error: err.detail ?? "Backend resume stream failed" }, { status: 500 });
      }
      if (backendRes.body) {
        return new Response(backendRes.body, {
          headers: {
            "Content-Type": "text/event-stream; charset=utf-8",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
          },
        });
      }
      const result = await consumeResumeSse(backendRes);
      return NextResponse.json(result);
    }

    const result = await runResumeOptimizerAgent(input);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "简历优化 Agent 失败" },
      { status: 500 },
    );
  }
}
