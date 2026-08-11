export type PlayerStrategy = "conservative" | "aggressive" | "random";

export type ResumeOptimizeInput = {
  studentId: string;
  originalResume: string;
  targetJob: string;
  iterations?: number;
  playerStrategy?: PlayerStrategy;
  scoreTarget?: number;
};

export type ResumeOptimizeIteration = {
  iteration: number;
  overallScore: number;
  weakDimensions: string[];
  resumePreview: string;
};

export type ResumeOptimizeResult = {
  optimizedResume: string;
  originalScore: number;
  finalScore: number;
  improvementHistory: ResumeOptimizeIteration[];
  modificationLog: string[];
  suggestedModifications: string[];
  reasoningTrace: string[];
  engine: string;
};
