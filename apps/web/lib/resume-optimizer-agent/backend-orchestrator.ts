import type { ResumeOptimizeInput, ResumeOptimizeResult } from "./types";

function apiBase(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000/api/v1"
  ).replace(/\/$/, "");
}

export function useBackendResumeAgent(): boolean {
  return (process.env.RESUME_OPTIMIZER_ENGINE ?? "langgraph").toLowerCase() !== "next";
}

export async function runBackendResumeOptimizer(input: ResumeOptimizeInput): Promise<ResumeOptimizeResult> {
  const res = await fetch(`${apiBase()}/students/${encodeURIComponent(input.studentId)}/resume-optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: input.studentId,
      original_resume: input.originalResume,
      target_job: input.targetJob,
      iterations: input.iterations ?? 3,
      player_strategy: input.playerStrategy ?? "conservative",
      score_target: input.scoreTarget ?? 85,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { detail?: string };
    throw new Error(err.detail ?? `Backend resume agent failed: ${res.status}`);
  }
  const data = (await res.json()) as {
    optimized_resume?: string;
    optimizedResume?: string;
    original_score?: number;
    originalScore?: number;
    final_score?: number;
    finalScore?: number;
    improvement_history?: { iteration: number; overall_score: number; weak_dimensions: string[]; resume_preview: string }[];
    improvementHistory?: ResumeOptimizeResult["improvementHistory"];
    modification_log?: string[];
    modificationLog?: string[];
    suggested_resume_modifications?: string[];
    suggestedModifications?: string[];
    reasoning_trace?: string[];
    reasoningTrace?: string[];
    engine?: string;
  };
  return {
    optimizedResume: data.optimizedResume ?? data.optimized_resume ?? "",
    originalScore: data.originalScore ?? data.original_score ?? 0,
    finalScore: data.finalScore ?? data.final_score ?? 0,
    improvementHistory: (data.improvementHistory ??
      data.improvement_history?.map((h) => ({
        iteration: h.iteration,
        overallScore: h.overall_score,
        weakDimensions: h.weak_dimensions,
        resumePreview: h.resume_preview,
      })) ??
      []) as ResumeOptimizeResult["improvementHistory"],
    modificationLog: data.modificationLog ?? data.modification_log ?? [],
    suggestedModifications: data.suggestedModifications ?? data.suggested_resume_modifications ?? [],
    reasoningTrace: data.reasoningTrace ?? data.reasoning_trace ?? [],
    engine: data.engine ?? "mock",
  };
}

export async function proxyBackendResumeStream(input: ResumeOptimizeInput): Promise<Response> {
  return fetch(`${apiBase()}/students/${encodeURIComponent(input.studentId)}/resume-optimize/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      student_id: input.studentId,
      original_resume: input.originalResume,
      target_job: input.targetJob,
      iterations: input.iterations ?? 3,
      player_strategy: input.playerStrategy ?? "conservative",
      score_target: input.scoreTarget ?? 85,
    }),
    cache: "no-store",
  });
}
