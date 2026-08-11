export type PlatformRole = "student" | "enterprise" | "school";

export type AbilityDimension = {
  key: string;
  label: string;
  score: number;
  trend: "up" | "flat" | "down";
};

export type AgentReview = {
  agent: string;
  score: number;
  summary: string;
  highlights: string[];
};

export type SimulationType = "growth" | "job";

export type SimulationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type SimulationResult = {
  sessionId: string;
  simulationType: SimulationType;
  overallScore: number;
  abilityScores: AbilityDimension[];
  agentReviews: AgentReview[];
  summary: string;
  recommendations: string[];
  jobMatches?: JobMatch[];
};

export type JobMatch = {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
  reasons: string[];
};

export type NavItem = {
  label: string;
  href: string;
};

export type DashboardMetric = {
  title: string;
  value: string;
  delta: string;
  hint: string;
};

export type CandidateSimulationSummary = {
  sessionId: string;
  simulationType: string;
  overallScore: number;
  summary: string;
  createdAt: string;
};

export type CandidateAbilitySnapshot = {
  abilityKey: string;
  abilityLabel: string;
  score: number;
  trend: string;
};

export type CandidateRecommendation = {
  jobId: string;
  title: string;
  company: string;
  matchScore: number;
};

export type CandidateDetail = {
  studentId: string;
  name: string;
  major: string;
  grade: string;
  overallScore: number;
  strengths: string[];
  riskFlags: string[];
  latestSimulations: CandidateSimulationSummary[];
  abilitySnapshot: CandidateAbilitySnapshot[];
  recommendations: CandidateRecommendation[];
  applicationPackages: ApplicationPackage[];
};

export type SchoolStudentSimulation = {
  sessionId: string;
  simulationType: string;
  overallScore: number;
  summary: string;
  createdAt: string;
};

export type SchoolStudentAbilitySnapshot = {
  abilityKey: string;
  abilityLabel: string;
  score: number;
  trend: string;
};

export type SchoolInterventionItem = {
  title: string;
  priority: string;
  owner: string;
  dueDate: string;
};

export type SchoolStudentDetail = {
  studentId: string;
  name: string;
  major: string;
  grade: string;
  riskLevel: string;
  overallScore: number;
  focusAreas: string[];
  latestSimulations: SchoolStudentSimulation[];
  abilitySnapshot: SchoolStudentAbilitySnapshot[];
  interventions: SchoolInterventionItem[];
};

export type EnterpriseTalentPoolItem = {
  studentId: string;
  name: string;
  major: string;
  grade: string;
  overallScore: number;
  riskLevel: string;
  strengths: string[];
  latestSimulationType: string;
  latestRecommendationTitle?: string;
  latestRecommendationCompany?: string;
  latestRecommendationScore?: number;
};

export type SchoolStudentSummary = {
  userId: string;
  name: string;
  major: string;
  riskLevel: string;
  overallScore: number;
  latestSimulationType: string;
};

export type StudentDashboardData = {
  studentId: string;
  metrics: DashboardMetric[];
  todaySuggestions: string[];
  riskSummary: string;
  resumeSnapshot?: ResumeSnapshot;
};

export type StudentApplication = {
  id: string;
  jobId?: string;
  companyId?: string;
  job: string;
  company: string;
  status: string;
  date: string;
  resumeName?: string;
  resumeFitScore?: number;
  assessmentScore?: number;
  hasAssessment?: boolean;
};

export type EnterpriseApplication = {
  applicationId: string;
  studentId: string;
  jobId?: string;
  companyId?: string;
  jobTitle: string;
  company: string;
  status: string;
  appliedAt: string;
  resumeName?: string;
  resumeFitScore?: number;
  assessmentScore?: number;
};

export type TargetProfile = {
  targetRole: string;
  businessFocus: string;
  personalEdge: string;
  challengeBoundary: string;
  successSignal: string;
};

export type ResumeExtractedInfo = {
  candidateName: string;
  education: string[];
  skills: string[];
  projects: string[];
  internshipExperience: string[];
};

export type ResumeAnalysisResult = {
  fitScore: number;
  fitSummary: string;
  highlights: string[];
  risks: string[];
  suggestions: string[];
};

export type ResumeAnalysis = {
  analysisId: string;
  studentId: string;
  resumeName: string;
  targetJob: string;
  extracted: ResumeExtractedInfo;
  analysis: ResumeAnalysisResult;
  createdAt: string;
};

export type ResumeSnapshot = {
  resumeName: string;
  targetJob: string;
  fitScore: number;
  fitSummary: string;
  createdAt: string;
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

export type AssessmentQuestion = {
  questionId: string;
  section: string;
  prompt: string;
  inputType: "text" | "code" | "artifact";
  rubric: string;
};

export type AssessmentPlan = {
  assessmentId: string;
  studentId: string;
  targetJob: string;
  targetProfile: TargetProfile;
  questions: AssessmentQuestion[];
  warmupStoryline: string[];
  createdAt: string;
};

export type AssessmentDimension = {
  dimension: string;
  score: number;
  comment: string;
};

export type AssessmentOutcome = {
  assessmentId: string;
  overallScore: number;
  summary: string;
  dimensions: AssessmentDimension[];
  recommendations: string[];
  createdAt: string;
};

export type SimulationDigestItem = {
  sessionId: string;
  simulationType: string;
  overallScore: number;
  summary: string;
  createdAt: string;
};

export type ApplicationPackage = {
  applicationId: string;
  studentId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: string;
  submittedAt: string;
  resumeName: string;
  resumeText: string;
  resumeAnalysis: ResumeAnalysis;
  assessmentResult: AssessmentOutcome;
  simulationDigest: SimulationDigestItem[];
};

export type ApplicationSubmitResult = {
  studentId: string;
  application: StudentApplication;
  package: ApplicationPackage;
};

export type SimulationHistoryItem = {
  sessionId: string;
  simulationType: "growth" | "job";
  scene: string;
  overallScore: number;
  summary: string;
  createdAt: string;
};

export type AbilityTrendPoint = {
  date: string;
  score: number;
};

export type AbilityTrendSeries = {
  abilityKey: string;
  abilityLabel: string;
  points: AbilityTrendPoint[];
};

export type EpisodeState = {
  confidence: number;
  pressure: number;
  energy: number;
  readiness: number;
};

export type EpisodeEvent = {
  id: string;
  stage: number;
  title: string;
  description: string;
  choices: string[];
  npcRole: string;
  npcGoal: string;
  openingLine: string;
};

export type EpisodeDialogueMessage = {
  speaker: "user" | "npc";
  content: string;
  timestamp: string;
};

export type EpisodeTurnResult = {
  turn: number;
  choice: string;
  aggregate: SimulationResult;
  stateAfter: EpisodeState;
  narrative: string;
  engine: string;
  fallbackReason?: string | null;
};

export type EpisodeEnding = {
  code: string;
  title: string;
  summary: string;
  nextSteps: string[];
};

export type RecalledMemory = {
  memoryId: string;
  text: string;
  reflectedInStory: boolean;
};

export type LifeMemory = {
  memoryId: string;
  memoryText: string;
  keywords: string[];
  importance: number;
  episodeId: string | null;
  createdAt: string | null;
};

export type AgentStepResult = {
  episode: SimulationEpisode;
  finished: boolean;
  endingTriggered: boolean;
  reasoningTrace: string[];
  recalledMemories: RecalledMemory[];
  engine: string;
};

export type SimulationEpisode = {
  episodeId: string;
  studentId: string;
  simulationType: "growth" | "job";
  target: string;
  totalStages: number;
  currentStage: number;
  status: "running" | "completed";
  state: EpisodeState;
  currentEvent: EpisodeEvent | null;
  dialogue: EpisodeDialogueMessage[];
  turns: EpisodeTurnResult[];
  ending?: EpisodeEnding | null;
  recalledMemories?: RecalledMemory[];
  endingType?: string | null;
  totalStagesDynamic?: number;
  reasoningTrace?: string[];
};

export type TransformationProjectStatus = "open" | "matched" | "closed" | (string & {});

export type TransformationProject = {
  id: string;
  creatorId: string;
  creatorRole: "student" | "enterprise" | "school" | (string & {});
  projectType: "achievement_push" | "demand_pull" | "collaborative" | (string & {});
  title: string;
  description: string;
  domain: string;
  maturityLevel: string | null;
  budgetRange: string | null;
  cooperationMode: string | null;
  requiredAbilities: string[];
  status: TransformationProjectStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  createdAt: string;
  updatedAt: string;
};

export type TransformationDashboardData = {
  metrics: DashboardMetric[];
  projects: TransformationProject[];
};

export type ResearchAchievementStage =
  | "published"
  | "negotiating"
  | "contracted"
  | "incubating"
  | "industrializing"
  | (string & {});

export type ResearchAchievement = {
  id: string;
  creatorId: string;
  creatorRole: "student" | "enterprise" | "school" | (string & {});
  title: string;
  abstract: string;
  achievementType: string;
  domain: string;
  keywords: string[];
  applicationScenario: string | null;
  ipStatus: string;
  patentNumbers: string[];
  patentType: string | null;
  publicationLink: string | null;
  trlLevel: number | null;
  maturityDesc: string | null;
  cooperationMode: string;
  budgetRange: string | null;
  transformationStage: ResearchAchievementStage;
  teamName: string | null;
  institutionName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  requiredAbilities: string[];
  status: "active" | "inactive" | (string & {});
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};

export type EnterpriseDemand = {
  id: string;
  creatorId: string;
  creatorRole: "student" | "enterprise" | "school" | (string & {});
  title: string;
  description: string;
  domain: string;
  cooperationMode: string;
  budgetRange: string | null;
  urgencyLevel: "短期" | "中期" | "长期" | (string & {});
  technicalRequirements: string | null;
  requiredAbilities: string[];
  targetTrl: number | null;
  enterpriseName: string;
  enterpriseScale: string | null;
  industrySector: string | null;
  verificationTasks: string[];
  achievementAttribution: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  status: "active" | "inactive" | (string & {});
  matchCount: number;
  createdAt: string;
  updatedAt: string;
};
