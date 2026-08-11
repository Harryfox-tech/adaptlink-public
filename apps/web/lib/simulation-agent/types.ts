import type {
  EpisodeDialogueMessage,
  EpisodeEnding,
  EpisodeEvent,
  EpisodeState,
  EpisodeTurnResult,
  RecalledMemory,
  SimulationEpisode,
} from "@/lib/types";

export type EpisodeAgentState = {
  episodeId: string;
  studentId: string;
  simulationType: "growth" | "job";
  target: string;
  currentStage: number;
  totalStagesDynamic: number;
  status: "running" | "completed";
  state: EpisodeState;
  currentEvent: EpisodeEvent | null;
  dialogue: EpisodeDialogueMessage[];
  turns: EpisodeTurnResult[];
  ending: EpisodeEnding | null;
  endingType: string | null;
  eventHistory: string[];
  playerChoices: string[];
  longTermMemories: RecalledMemory[];
  recalledMemories: RecalledMemory[];
  reasoningTrace: string[];
  engine: string;
  phaseComplete: boolean;
  lastTurnScore: number | null;
  lastPlayerChoice: string | null;
};

export type AgentStartInput = {
  studentId: string;
  simulationType: "growth" | "job";
  target: string;
};

export type AgentActInput = {
  episodeId: string;
  choice: string;
};

export type AgentStepResult = {
  episode: SimulationEpisode;
  finished: boolean;
  endingTriggered: boolean;
  reasoningTrace: string[];
  recalledMemories: RecalledMemory[];
  engine: string;
};
