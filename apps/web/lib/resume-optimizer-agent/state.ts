import type { ResumeOptimizeIteration, PlayerStrategy } from "./types";

export type ResumeOptimizerAgentState = {
  studentId: string;
  currentResume: string;
  targetJob: string;
  playerStrategy: PlayerStrategy;
  iterationsMax: number;
  scoreTarget: number;
  iterationCount: number;
  originalScore: number | null;
  bestScore: number;
  bestResume: string;
  history: ResumeOptimizeIteration[];
  modificationLog: string[];
  reasoningTrace: string[];
  engine: string;
  done: boolean;
  lastWeakDimensions: string[];
  lastSuggestions: string[];
};

export function createOptimizerState(input: {
  studentId: string;
  originalResume: string;
  targetJob: string;
  playerStrategy?: PlayerStrategy;
  iterations?: number;
  scoreTarget?: number;
}): ResumeOptimizerAgentState {
  return {
    studentId: input.studentId,
    currentResume: input.originalResume,
    targetJob: input.targetJob,
    playerStrategy: input.playerStrategy ?? "conservative",
    iterationsMax: input.iterations ?? 3,
    scoreTarget: input.scoreTarget ?? 85,
    iterationCount: 0,
    originalScore: null,
    bestScore: 0,
    bestResume: input.originalResume,
    history: [],
    modificationLog: [],
    reasoningTrace: ["[ReAct] 简历优化 Agent 启动"],
    engine: "mock",
    done: false,
    lastWeakDimensions: [],
    lastSuggestions: [],
  };
}
