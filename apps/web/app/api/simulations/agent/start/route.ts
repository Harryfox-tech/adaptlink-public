import { NextResponse } from "next/server";
import { runAgentStart } from "@/lib/simulation-agent/orchestrator";
import { agentErrorResponse } from "@/lib/simulation-agent/route-utils";
import { assertStudentApiAccess } from "@/lib/assert-student-api";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      simulationType?: "growth" | "job";
      target?: string;
    };

    if (!body.studentId || !body.simulationType || !body.target?.trim()) {
      return NextResponse.json(
        { error: "缺少 studentId、simulationType 或 target", code: "INVALID_INPUT", retryable: false },
        { status: 400 },
      );
    }

    const denied = await assertStudentApiAccess(body.studentId);
    if (denied) return denied;

    const result = await runAgentStart({
      studentId: body.studentId,
      simulationType: body.simulationType,
      target: body.target.trim(),
    });

    return NextResponse.json(result);
  } catch (e) {
    return agentErrorResponse(e);
  }
}
