import type { ResumeOptimizeInput, ResumeOptimizeResult } from "./types";
import { runBackendResumeOptimizer, useBackendResumeAgent } from "./backend-orchestrator";
import { createOptimizerState } from "./state";
import { runResumeOptimizerReAct } from "./react-loop";

export async function runResumeOptimizerAgent(input: ResumeOptimizeInput): Promise<ResumeOptimizeResult> {
  if (useBackendResumeAgent()) {
    return runBackendResumeOptimizer(input);
  }

  const state = createOptimizerState(input);
  await runResumeOptimizerReAct(state);

  return {
    optimizedResume: state.currentResume,
    originalScore: state.originalScore ?? 0,
    finalScore: state.bestScore,
    improvementHistory: state.history,
    modificationLog: state.modificationLog,
    suggestedModifications: state.lastSuggestions,
    reasoningTrace: state.reasoningTrace,
    engine: state.engine,
  };
}
