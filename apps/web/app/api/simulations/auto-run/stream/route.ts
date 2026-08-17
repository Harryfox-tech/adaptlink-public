import { proxyBackendAutoRunStream } from "@/lib/simulation-agent/auto-run-backend";
import { assertStudentApiAccess } from "@/lib/assert-student-api";
import { getAuthToken } from "@/lib/auth-server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      studentId?: string;
      resumeContent?: string;
      targetJob?: string;
      simulationType?: "growth" | "job";
      playerStrategy?: "conservative" | "aggressive" | "random";
      maxTurns?: number;
    };

    if (!body.studentId || !body.resumeContent?.trim() || !body.targetJob?.trim()) {
      return Response.json({ error: "缺少 studentId、resumeContent 或 targetJob" }, { status: 400 });
    }

    const denied = await assertStudentApiAccess(body.studentId);
    if (denied) return denied;

    const token = await getAuthToken();
    const backendRes = await proxyBackendAutoRunStream(
      {
        studentId: body.studentId,
        resumeContent: body.resumeContent.trim(),
        targetJob: body.targetJob.trim(),
        simulationType: body.simulationType ?? "job",
        playerStrategy: body.playerStrategy ?? "conservative",
        maxTurns: body.maxTurns ?? 12,
      },
      token,
    );

    if (!backendRes.ok || !backendRes.body) {
      const err = (await backendRes.json().catch(() => ({}))) as { detail?: string };
      return Response.json({ error: err.detail ?? "Auto-run stream failed" }, { status: backendRes.status || 500 });
    }

    return new Response(backendRes.body, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Auto-run stream failed" }, { status: 500 });
  }
}
