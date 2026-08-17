import { NextResponse } from "next/server";
import { runAgentAct } from "@/lib/simulation-agent/orchestrator";
import { agentErrorResponse } from "@/lib/simulation-agent/route-utils";
import { requireStudentApiSession } from "@/lib/assert-student-api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      episodeId?: string;
      choice?: string;
    };

    if (!body.episodeId || !body.choice?.trim()) {
      return NextResponse.json(
        { error: "缺少 episodeId 或 choice", code: "INVALID_INPUT", retryable: false },
        { status: 400 },
      );
    }

    const session = await requireStudentApiSession();
    if (session instanceof NextResponse) return session;

    const result = await runAgentAct(
      {
        episodeId: body.episodeId,
        choice: body.choice.trim(),
      },
      undefined,
      session.token,
    );

    return NextResponse.json(result);
  } catch (e) {
    return agentErrorResponse(e);
  }
}
