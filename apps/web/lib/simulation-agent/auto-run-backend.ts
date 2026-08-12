function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/$/, "");
}

export async function proxyBackendAutoRunStream(input: {
  studentId: string;
  resumeContent: string;
  targetJob: string;
  simulationType: "growth" | "job";
  playerStrategy: "conservative" | "aggressive" | "random";
  maxTurns: number;
}): Promise<Response> {
  return fetch(`${apiBase()}/simulations/auto-run/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: input.studentId,
      resume_content: input.resumeContent,
      target_job: input.targetJob,
      simulation_type: input.simulationType,
      player_strategy: input.playerStrategy,
      max_turns: input.maxTurns,
    }),
    cache: "no-store",
  });
}
