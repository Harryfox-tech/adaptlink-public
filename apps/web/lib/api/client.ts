import {
  ApplicationSubmitResult,
  ApplicationPackage,
  AssessmentOutcome,
  AssessmentPlan,
  AbilityTrendSeries,
  CandidateDetail,
  EnterpriseApplication,
  EnterpriseTalentPoolItem,
  ResumeAnalysis,
  SchoolStudentDetail,
  SchoolStudentSummary,
  EpisodeDialogueMessage,
  SimulationEpisode,
  EpisodeState,
  EpisodeEvent,
  EpisodeTurnResult,
  SimulationHistoryItem,
  StudentApplication,
  StudentDashboardData,
  TargetProfile,
  SimulationResult,
} from "@/lib/types";

const API_BASE_SERVER = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

function resolveApiBase() {
  if (typeof window !== "undefined") {
    return "/api/v1";
  }
  return API_BASE_SERVER;
}

async function request<T>(path: string, init?: RequestInit, token?: string | null): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(`${resolveApiBase()}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

async function authedRequest<T>(path: string, token: string | null, init?: RequestInit): Promise<T> {
  return await request<T>(path, init, token);
}

function emptyStudentDashboard(studentId: string): StudentDashboardData {
  return {
    studentId,
    metrics: [
      { title: "综合能力得分", value: "—", delta: "—", hint: "完成模拟后生成" },
      { title: "模拟训练次数", value: "0", delta: "0", hint: "尚未开始训练" },
      { title: "岗位匹配中位分", value: "—", delta: "—", hint: "完成求职模拟后更新" },
      { title: "本周行动项", value: "0", delta: "0", hint: "从模拟建议自动生成" },
    ],
    todaySuggestions: [
      "开始一次成长模拟，建立能力基线",
      "在求职模拟中完成一轮高压追问训练",
      "上传简历并生成首份匹配分析",
    ],
    riskSummary: "暂无模拟数据。完成成长或求职模拟后，系统将生成个性化诊断与行动建议。",
    resumeSnapshot: undefined,
  };
}

type ApiAbilityDimension = {
  key: string;
  label: string;
  score: number;
  trend: "up" | "flat" | "down";
};

type ApiAgentReview = {
  agent: string;
  score: number;
  summary: string;
  highlights: string[];
};

type ApiJobRecommendation = {
  job_id: string;
  title: string;
  company: string;
  match_score: number;
  reasons: string[];
};

type ApiSimulationAggregate = {
  session_id: string;
  simulation_type: "growth" | "job";
  overall_score: number;
  summary: string;
  recommendations: string[];
  ability_scores: ApiAbilityDimension[];
  agent_reviews: ApiAgentReview[];
  job_recommendations: ApiJobRecommendation[];
};

type ApiSimulationStartResponse = {
  session_id: string;
  status: "running" | "completed";
  aggregate: ApiSimulationAggregate;
};

type ApiRecommendationItem = {
  job_id: string;
  title: string;
  company: string;
  match_score: number;
  reasons: string[];
};

type ApiRecommendationResponse = {
  student_id: string;
  items: ApiRecommendationItem[];
};

type ApiCandidateSimulationSummary = {
  session_id: string;
  simulation_type: string;
  overall_score: number;
  summary: string;
  created_at: string;
};

type ApiCandidateAbilitySnapshot = {
  ability_key: string;
  ability_label: string;
  score: number;
  trend: string;
};

type ApiCandidateRecommendation = {
  job_id: string;
  title: string;
  company: string;
  match_score: number;
};

type ApiCandidateDetail = {
  student_id: string;
  name: string;
  major: string;
  grade: string;
  overall_score: number;
  strengths: string[];
  risk_flags: string[];
  latest_simulations: ApiCandidateSimulationSummary[];
  ability_snapshot: ApiCandidateAbilitySnapshot[];
  recommendations: ApiCandidateRecommendation[];
  application_packages: ApiApplicationPackage[];
};

type ApiSchoolStudentSimulation = {
  session_id: string;
  simulation_type: string;
  overall_score: number;
  summary: string;
  created_at: string;
};

type ApiSchoolStudentAbilitySnapshot = {
  ability_key: string;
  ability_label: string;
  score: number;
  trend: string;
};

type ApiSchoolInterventionItem = {
  title: string;
  priority: string;
  owner: string;
  due_date: string;
};

type ApiSchoolStudentDetail = {
  student_id: string;
  name: string;
  major: string;
  grade: string;
  risk_level: string;
  overall_score: number;
  focus_areas: string[];
  latest_simulations: ApiSchoolStudentSimulation[];
  ability_snapshot: ApiSchoolStudentAbilitySnapshot[];
  interventions: ApiSchoolInterventionItem[];
};

type ApiTalentPoolItem = {
  student_id: string;
  name: string;
  major: string;
  grade: string;
  overall_score: number;
  risk_level: string;
  strengths: string[];
  latest_simulation_type: string;
  latest_recommendation_title?: string;
  latest_recommendation_company?: string;
  latest_recommendation_score?: number;
};

type ApiTalentPoolResponse = {
  items: ApiTalentPoolItem[];
};

type ApiSchoolStudentSummary = {
  user_id: string;
  name: string;
  major: string;
  risk_level: string;
  overall_score: number;
  latest_simulation_type: string;
};

type ApiStudentDashboardMetric = {
  title: string;
  value: string;
  delta: string;
  hint: string;
};

type ApiStudentDashboardResponse = {
  student_id: string;
  metrics: ApiStudentDashboardMetric[];
  today_suggestions: string[];
  risk_summary: string;
  resume_snapshot?: {
    resume_name: string;
    target_job: string;
    fit_score: number;
    fit_summary: string;
    created_at: string;
  };
};

type ApiStudentApplicationItem = {
  id: string;
  job_id?: string | null;
  company_id?: string | null;
  job: string;
  company: string;
  status: string;
  date: string;
  resume_name?: string;
  resume_fit_score?: number;
  assessment_score?: number;
  has_assessment?: boolean;
};

type ApiStudentApplicationsResponse = {
  student_id: string;
  items: ApiStudentApplicationItem[];
};

type ApiTargetProfile = {
  target_role: string;
  business_focus: string;
  personal_edge: string;
  challenge_boundary: string;
  success_signal: string;
};

type ApiResumeAnalysis = {
  analysis_id: string;
  student_id: string;
  resume_name: string;
  target_job: string;
  extracted: {
    candidate_name: string;
    education: string[];
    skills: string[];
    projects: string[];
    internship_experience: string[];
  };
  analysis: {
    fit_score: number;
    fit_summary: string;
    highlights: string[];
    risks: string[];
    suggestions: string[];
  };
  created_at: string;
};

type ApiResumeExtract = {
  resume_name: string;
  extracted_text: string;
  file_type: string;
  char_count: number;
};

type ApiAssessmentPlan = {
  assessment_id: string;
  student_id: string;
  target_job: string;
  target_profile: ApiTargetProfile;
  questions: {
    question_id: string;
    section: string;
    prompt: string;
    input_type: "text" | "code" | "artifact";
    rubric: string;
  }[];
  warmup_storyline: string[];
  created_at: string;
};

type ApiAssessmentOutcome = {
  assessment_id: string;
  overall_score: number;
  summary: string;
  dimensions: {
    dimension: string;
    score: number;
    comment: string;
  }[];
  recommendations: string[];
  created_at: string;
};

type ApiApplicationPackage = {
  application_id: string;
  student_id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: string;
  submitted_at: string;
  resume_name: string;
  resume_text: string;
  resume_analysis: ApiResumeAnalysis;
  assessment_result: ApiAssessmentOutcome;
  simulation_digest: {
    session_id: string;
    simulation_type: string;
    overall_score: number;
    summary: string;
    created_at: string;
  }[];
};

type ApiApplicationSubmitResult = {
  student_id: string;
  application: ApiStudentApplicationItem;
  package: ApiApplicationPackage;
};

type ApiSimulationHistoryItem = {
  session_id: string;
  simulation_type: "growth" | "job";
  scene: string;
  overall_score: number;
  summary: string;
  created_at: string;
};

type ApiSimulationHistoryResponse = {
  student_id: string;
  items: ApiSimulationHistoryItem[];
};

type ApiAbilityTrendPoint = {
  date: string;
  score: number;
};

type ApiAbilityTrendSeries = {
  ability_key: string;
  ability_label: string;
  points: ApiAbilityTrendPoint[];
};

type ApiAbilityTrendResponse = {
  student_id: string;
  series: ApiAbilityTrendSeries[];
};

type ApiEpisodeState = EpisodeState;

type ApiEpisodeEvent = {
  id: string;
  stage: number;
  title: string;
  description: string;
  choices: string[];
  npc_role: string;
  npc_goal: string;
  opening_line: string;
};

type ApiEpisodeTurnResult = {
  turn: number;
  choice: string;
  aggregate: ApiSimulationAggregate;
  state_after: ApiEpisodeState;
  narrative: string;
  engine: string;
  fallback_reason?: string | null;
};

type ApiSimulationEpisode = {
  episode_id: string;
  student_id: string;
  simulation_type: "growth" | "job";
  target: string;
  total_stages: number;
  current_stage: number;
  status: "running" | "completed";
  state: ApiEpisodeState;
  current_event: ApiEpisodeEvent | null;
  dialogue: {
    speaker: "user" | "npc";
    content: string;
    timestamp: string;
  }[];
  turns: ApiEpisodeTurnResult[];
  ending?: {
    code: string;
    title: string;
    summary: string;
    next_steps: string[];
  } | null;
  recalled_memories?: { memory_id: string; text: string; reflected_in_story: boolean }[];
  ending_type?: string | null;
  total_stages_dynamic?: number | null;
  reasoning_trace?: string[];
};

type ApiEpisodeActionResponse = {
  episode: ApiSimulationEpisode;
  finished: boolean;
};

type ApiEpisodeDialogueResponse = {
  episode_id: string;
  npc_role: string;
  reply: string;
  dialogue: {
    speaker: "user" | "npc";
    content: string;
    timestamp: string;
  }[];
};

function mapAggregateToSimulationResult(aggregate: ApiSimulationAggregate): SimulationResult {
  return {
    sessionId: aggregate.session_id,
    simulationType: aggregate.simulation_type,
    overallScore: aggregate.overall_score,
    summary: aggregate.summary,
    recommendations: aggregate.recommendations,
    abilityScores: aggregate.ability_scores,
    agentReviews: aggregate.agent_reviews,
    jobMatches: aggregate.job_recommendations.map((job) => ({
      jobId: job.job_id,
      title: job.title,
      company: job.company,
      matchScore: job.match_score,
      reasons: job.reasons,
    })),
  };
}

function mapEpisode(api: ApiSimulationEpisode): SimulationEpisode {
  return {
    episodeId: api.episode_id,
    studentId: api.student_id,
    simulationType: api.simulation_type,
    target: api.target,
    totalStages: api.total_stages,
    currentStage: api.current_stage,
    status: api.status,
    state: api.state,
    currentEvent: api.current_event
      ? ({
          id: api.current_event.id,
          stage: api.current_event.stage,
          title: api.current_event.title,
          description: api.current_event.description,
          choices: api.current_event.choices,
          npcRole: api.current_event.npc_role,
          npcGoal: api.current_event.npc_goal,
          openingLine: api.current_event.opening_line,
        } satisfies EpisodeEvent)
      : null,
    dialogue: api.dialogue.map(
      (item) =>
        ({
          speaker: item.speaker,
          content: item.content,
          timestamp: item.timestamp,
        } satisfies EpisodeDialogueMessage),
    ),
    turns: api.turns.map(
      (turn) =>
        ({
          turn: turn.turn,
          choice: turn.choice,
          aggregate: mapAggregateToSimulationResult(turn.aggregate),
          stateAfter: turn.state_after,
          narrative: turn.narrative,
          engine: turn.engine,
          fallbackReason: turn.fallback_reason,
        } satisfies EpisodeTurnResult),
    ),
    ending: api.ending
      ? {
          code: api.ending.code,
          title: api.ending.title,
          summary: api.ending.summary,
          nextSteps: api.ending.next_steps,
        }
      : null,
    recalledMemories: (api.recalled_memories ?? []).map((m) => ({
      memoryId: m.memory_id,
      text: m.text,
      reflectedInStory: m.reflected_in_story,
    })),
    endingType: api.ending_type,
    totalStagesDynamic: api.total_stages_dynamic ?? undefined,
    reasoningTrace: api.reasoning_trace ?? [],
  };
}

function mapResumeAnalysis(item: ApiResumeAnalysis): ResumeAnalysis {
  return {
    analysisId: item.analysis_id,
    studentId: item.student_id,
    resumeName: item.resume_name,
    targetJob: item.target_job,
    extracted: {
      candidateName: item.extracted.candidate_name,
      education: item.extracted.education,
      skills: item.extracted.skills,
      projects: item.extracted.projects,
      internshipExperience: item.extracted.internship_experience,
    },
    analysis: {
      fitScore: item.analysis.fit_score,
      fitSummary: item.analysis.fit_summary,
      highlights: item.analysis.highlights,
      risks: item.analysis.risks,
      suggestions: item.analysis.suggestions,
    },
    createdAt: item.created_at,
  };
}

function mapTargetProfile(item: ApiTargetProfile): TargetProfile {
  return {
    targetRole: item.target_role,
    businessFocus: item.business_focus,
    personalEdge: item.personal_edge,
    challengeBoundary: item.challenge_boundary,
    successSignal: item.success_signal,
  };
}

function mapAssessmentOutcome(item: ApiAssessmentOutcome): AssessmentOutcome {
  return {
    assessmentId: item.assessment_id,
    overallScore: item.overall_score,
    summary: item.summary,
    dimensions: item.dimensions.map((row) => ({
      dimension: row.dimension,
      score: row.score,
      comment: row.comment,
    })),
    recommendations: item.recommendations,
    createdAt: item.created_at,
  };
}

function mapApplicationPackage(item: ApiApplicationPackage): ApplicationPackage {
  return {
    applicationId: item.application_id,
    studentId: item.student_id,
    jobId: item.job_id,
    jobTitle: item.job_title,
    company: item.company,
    status: item.status,
    submittedAt: item.submitted_at,
    resumeName: item.resume_name,
    resumeText: item.resume_text,
    resumeAnalysis: mapResumeAnalysis(item.resume_analysis),
    assessmentResult: mapAssessmentOutcome(item.assessment_result),
    simulationDigest: item.simulation_digest.map((row) => ({
      sessionId: row.session_id,
      simulationType: row.simulation_type,
      overallScore: row.overall_score,
      summary: row.summary,
      createdAt: row.created_at,
    })),
  };
}

export async function getGrowthSimulationResult(studentId: string, token?: string | null): Promise<SimulationResult | null> {
  try {
    const aggregate = await request<ApiSimulationAggregate>(
      `/simulations/growth/latest?student_id=${studentId}`,
      undefined,
      token ?? null,
    );
    return mapAggregateToSimulationResult(aggregate);
  } catch {
    return null;
  }
}

export async function getJobSimulationResult(studentId: string, token?: string | null): Promise<SimulationResult | null> {
  try {
    const aggregate = await request<ApiSimulationAggregate>(
      `/simulations/job/latest?student_id=${studentId}`,
      undefined,
      token ?? null,
    );
    return mapAggregateToSimulationResult(aggregate);
  } catch {
    return null;
  }
}

export async function getJobRecommendations(studentId: string, token?: string | null) {
  try {
    const response = await request<ApiRecommendationResponse>(
      `/recommendations/jobs?student_id=${studentId}`,
      undefined,
      token ?? null,
    );
    return {
      items: response.items.map((job) => ({
        jobId: job.job_id,
        title: job.title,
        company: job.company,
        matchScore: job.match_score,
        reasons: job.reasons,
      })),
    };
  } catch {
    return { items: [] as { jobId: string; title: string; company: string; matchScore: number; reasons: string[] }[] };
  }
}

export async function runSimulation(input: {
  studentId: string;
  simulationType: "growth" | "job";
  scene: string;
  answer: string;
  targetJob?: string;
}): Promise<SimulationResult> {
  const payload = {
    student_id: input.studentId,
    simulation_type: input.simulationType,
    scene: input.scene,
    target_job: input.targetJob,
    messages: [{ role: "user", content: input.answer }],
  };

  const result = await request<ApiSimulationStartResponse>("/simulations/run", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapAggregateToSimulationResult(result.aggregate);
}

const fallbackCandidateDetail: CandidateDetail = {
  studentId: "stu_001",
  name: "张同学",
  major: "信息管理与信息系统",
  grade: "2023级",
  overallScore: 79,
  strengths: ["责任意识", "执行稳定", "协作积极"],
  riskFlags: ["高压沟通波动", "业务案例深度待加强"],
  latestSimulations: [
    {
      sessionId: "sim_job_20260320_001",
      simulationType: "job",
      overallScore: 79,
      summary: "岗位理解较好，建议增强压力问答结构化表达。",
      createdAt: "2026-03-20T10:00:00+08:00",
    },
  ],
  abilitySnapshot: [
    { abilityKey: "communication", abilityLabel: "沟通表达能力", score: 78, trend: "up" },
    { abilityKey: "logic", abilityLabel: "逻辑分析能力", score: 75, trend: "flat" },
    { abilityKey: "fit", abilityLabel: "岗位匹配度", score: 79, trend: "up" },
  ],
  recommendations: [
    { jobId: "job_001", title: "产品运营专员", company: "星澜科技", matchScore: 86 },
    { jobId: "job_002", title: "校园市场培训生", company: "映河教育", matchScore: 81 },
  ],
  applicationPackages: [],
};

export async function getEnterpriseCandidateDetail(token: string | null, studentId: string): Promise<CandidateDetail> {
  try {
    const response = await authedRequest<ApiCandidateDetail>(`/enterprise/candidates/${studentId}`, token);
    return {
      studentId: response.student_id,
      name: response.name,
      major: response.major,
      grade: response.grade,
      overallScore: response.overall_score,
      strengths: response.strengths,
      riskFlags: response.risk_flags,
      latestSimulations: response.latest_simulations.map((item) => ({
        sessionId: item.session_id,
        simulationType: item.simulation_type,
        overallScore: item.overall_score,
        summary: item.summary,
        createdAt: item.created_at,
      })),
      abilitySnapshot: response.ability_snapshot.map((item) => ({
        abilityKey: item.ability_key,
        abilityLabel: item.ability_label,
        score: item.score,
        trend: item.trend,
      })),
      recommendations: response.recommendations.map((item) => ({
        jobId: item.job_id,
        title: item.title,
        company: item.company,
        matchScore: item.match_score,
      })),
      applicationPackages: response.application_packages.map((item) => mapApplicationPackage(item)),
    };
  } catch {
    return fallbackCandidateDetail;
  }
}

const fallbackSchoolStudentDetail: SchoolStudentDetail = {
  studentId: "stu_001",
  name: "张同学",
  major: "信息管理与信息系统",
  grade: "2023级",
  riskLevel: "medium",
  overallScore: 76,
  focusAreas: ["高压沟通", "业务分析深度", "结构化表达"],
  latestSimulations: [
    {
      sessionId: "sim_growth_20260320_001",
      simulationType: "growth",
      overallScore: 82,
      summary: "责任感与执行稳定，冲突沟通需加强。",
      createdAt: "2026-03-20T10:00:00+08:00",
    },
  ],
  abilitySnapshot: [
    { abilityKey: "communication", abilityLabel: "沟通表达能力", score: 74, trend: "flat" },
    { abilityKey: "logic", abilityLabel: "逻辑分析能力", score: 75, trend: "up" },
    { abilityKey: "resilience", abilityLabel: "抗压能力", score: 70, trend: "flat" },
  ],
  interventions: [
    { title: "每周一次压力问答训练", priority: "P1", owner: "就业指导老师", dueDate: "2026-04-10" },
    { title: "补充2个岗位业务分析案例", priority: "P1", owner: "学院导师", dueDate: "2026-04-15" },
    { title: "结构化表达复盘打卡", priority: "P2", owner: "辅导员", dueDate: "2026-04-20" },
  ],
};

export async function getSchoolStudentDetail(studentId: string): Promise<SchoolStudentDetail> {
  const response = await request<ApiSchoolStudentDetail>(`/school/students/${studentId}`);
  return {
    studentId: response.student_id,
    name: response.name,
    major: response.major,
    grade: response.grade,
    riskLevel: response.risk_level,
    overallScore: response.overall_score,
    focusAreas: response.focus_areas,
    latestSimulations: response.latest_simulations.map((item) => ({
      sessionId: item.session_id,
      simulationType: item.simulation_type,
      overallScore: item.overall_score,
      summary: item.summary,
      createdAt: item.created_at,
    })),
    abilitySnapshot: response.ability_snapshot.map((item) => ({
      abilityKey: item.ability_key,
      abilityLabel: item.ability_label,
      score: item.score,
      trend: item.trend,
    })),
    interventions: response.interventions.map((item) => ({
      title: item.title,
      priority: item.priority,
      owner: item.owner,
      dueDate: item.due_date,
    })),
  };
}

const fallbackTalentPool: EnterpriseTalentPoolItem[] = [
  {
    studentId: "stu_001",
    name: "张同学",
    major: "信息管理与信息系统",
    grade: "2023级",
    overallScore: 79,
    riskLevel: "medium",
    strengths: ["执行稳定", "协作积极", "责任意识"],
    latestSimulationType: "job",
    latestRecommendationTitle: "产品运营专员",
    latestRecommendationCompany: "星澜科技",
    latestRecommendationScore: 86,
  },
  {
    studentId: "stu_002",
    name: "李同学",
    major: "市场营销",
    grade: "2023级",
    overallScore: 83,
    riskLevel: "low",
    strengths: ["沟通表达", "活动执行", "抗压能力"],
    latestSimulationType: "growth",
    latestRecommendationTitle: "校园市场培训生",
    latestRecommendationCompany: "映河教育",
    latestRecommendationScore: 81,
  },
];

export async function getEnterpriseTalentPool(token: string | null, filters?: {
  keyword?: string;
  riskLevel?: string;
  minScore?: number;
}): Promise<EnterpriseTalentPoolItem[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.keyword) params.set("keyword", filters.keyword);
    if (filters?.riskLevel) params.set("risk_level", filters.riskLevel);
    if (typeof filters?.minScore === "number") params.set("min_score", String(filters.minScore));
    const query = params.toString() ? `?${params.toString()}` : "";

    const response = await authedRequest<ApiTalentPoolResponse>(`/enterprise/talent-pool${query}`, token);
    return response.items.map((item) => ({
      studentId: item.student_id,
      name: item.name,
      major: item.major,
      grade: item.grade,
      overallScore: item.overall_score,
      riskLevel: item.risk_level,
      strengths: item.strengths,
      latestSimulationType: item.latest_simulation_type,
      latestRecommendationTitle: item.latest_recommendation_title,
      latestRecommendationCompany: item.latest_recommendation_company,
      latestRecommendationScore: item.latest_recommendation_score,
    }));
  } catch {
    return fallbackTalentPool;
  }
}

const fallbackSchoolStudents: SchoolStudentSummary[] = [
  { userId: "stu_001", name: "张同学", major: "信息管理", riskLevel: "medium", overallScore: 76, latestSimulationType: "job" },
  { userId: "stu_002", name: "李同学", major: "市场营销", riskLevel: "low", overallScore: 84, latestSimulationType: "growth" },
  { userId: "stu_003", name: "王同学", major: "数据科学", riskLevel: "high", overallScore: 62, latestSimulationType: "job" },
];

export async function getSchoolStudentSummaries(filters?: {
  riskLevel?: string;
  minScore?: number;
}): Promise<SchoolStudentSummary[]> {
  const params = new URLSearchParams();
  if (filters?.riskLevel) params.set("risk_level", filters.riskLevel);
  if (typeof filters?.minScore === "number") params.set("min_score", String(filters.minScore));
  const query = params.toString() ? `?${params.toString()}` : "";

  const response = await request<ApiSchoolStudentSummary[]>(`/school/students${query}`);
  return response.map((item) => ({
    userId: item.user_id,
    name: item.name,
    major: item.major,
    riskLevel: item.risk_level,
    overallScore: item.overall_score,
    latestSimulationType: item.latest_simulation_type,
  }));
}

export async function getStudentDashboard(studentId: string, token?: string | null): Promise<StudentDashboardData> {
  try {
    const response = await request<ApiStudentDashboardResponse>(
      `/students/${studentId}/dashboard`,
      undefined,
      token ?? null,
    );
    return {
      studentId: response.student_id,
      metrics: response.metrics,
      todaySuggestions: response.today_suggestions,
      riskSummary: response.risk_summary,
      resumeSnapshot: response.resume_snapshot
        ? {
            resumeName: response.resume_snapshot.resume_name,
            targetJob: response.resume_snapshot.target_job,
            fitScore: response.resume_snapshot.fit_score,
            fitSummary: response.resume_snapshot.fit_summary,
            createdAt: response.resume_snapshot.created_at,
          }
        : undefined,
    };
  } catch {
    return emptyStudentDashboard(studentId);
  }
}

export async function getStudentApplications(studentId: string, token?: string | null): Promise<StudentApplication[]> {
  try {
    const response = await request<ApiStudentApplicationsResponse>(
      `/students/${studentId}/applications`,
      undefined,
      token ?? null,
    );
    return response.items.map((item) => ({
      id: item.id,
      jobId: item.job_id ?? undefined,
      companyId: item.company_id ?? undefined,
      job: item.job,
      company: item.company,
      status: item.status,
      date: item.date,
      resumeName: item.resume_name,
      resumeFitScore: item.resume_fit_score,
      assessmentScore: item.assessment_score,
      hasAssessment: item.has_assessment,
    }));
  } catch {
    return [];
  }
}

export async function getSimulationHistory(studentId: string, token?: string | null): Promise<SimulationHistoryItem[]> {
  try {
    const response = await request<ApiSimulationHistoryResponse>(
      `/simulations/history?student_id=${studentId}&limit=30`,
      undefined,
      token ?? null,
    );
    return response.items.map((item) => ({
      sessionId: item.session_id,
      simulationType: item.simulation_type,
      scene: item.scene,
      overallScore: item.overall_score,
      summary: item.summary,
      createdAt: item.created_at,
    }));
  } catch {
    return [];
  }
}

export async function getStudentAbilityTrend(studentId: string, token?: string | null): Promise<AbilityTrendSeries[]> {
  try {
    const response = await request<ApiAbilityTrendResponse>(
      `/students/${studentId}/ability-trend`,
      undefined,
      token ?? null,
    );
    return response.series.map((item) => ({
      abilityKey: item.ability_key,
      abilityLabel: item.ability_label,
      points: item.points,
    }));
  } catch {
    return [];
  }
}

export async function analyzeStudentResume(input: {
  studentId: string;
  resumeName: string;
  resumeText: string;
  targetJob: string;
}): Promise<ResumeAnalysis> {
  const response = await request<ApiResumeAnalysis>(`/students/${input.studentId}/resume-analysis`, {
    method: "POST",
    body: JSON.stringify({
      resume_name: input.resumeName,
      resume_text: input.resumeText,
      target_job: input.targetJob,
    }),
  });
  return mapResumeAnalysis(response);
}

export async function extractStudentResumeFromFile(input: { studentId: string; file: File }): Promise<{
  resumeName: string;
  extractedText: string;
  fileType: string;
  charCount: number;
}> {
  const formData = new FormData();
  formData.append("file", input.file);
  const response = await request<ApiResumeExtract>(`/students/${input.studentId}/resume-extract`, {
    method: "POST",
    body: formData,
  });
  return {
    resumeName: response.resume_name,
    extractedText: response.extracted_text,
    fileType: response.file_type,
    charCount: response.char_count,
  };
}

export async function generateStudentAssessment(input: {
  studentId: string;
  targetJob: string;
  targetProfile: TargetProfile;
}): Promise<AssessmentPlan> {
  const response = await request<ApiAssessmentPlan>(`/students/${input.studentId}/assessment/generate`, {
    method: "POST",
    body: JSON.stringify({
      target_job: input.targetJob,
      target_profile: {
        target_role: input.targetProfile.targetRole,
        business_focus: input.targetProfile.businessFocus,
        personal_edge: input.targetProfile.personalEdge,
        challenge_boundary: input.targetProfile.challengeBoundary,
        success_signal: input.targetProfile.successSignal,
      },
    }),
  });
  return {
    assessmentId: response.assessment_id,
    studentId: response.student_id,
    targetJob: response.target_job,
    targetProfile: mapTargetProfile(response.target_profile),
    questions: response.questions.map((item) => ({
      questionId: item.question_id,
      section: item.section,
      prompt: item.prompt,
      inputType: item.input_type,
      rubric: item.rubric,
    })),
    warmupStoryline: response.warmup_storyline,
    createdAt: response.created_at,
  };
}

export async function submitStudentAssessment(input: {
  studentId: string;
  assessmentId: string;
  targetJob: string;
  targetProfile: TargetProfile;
  answers: { questionId: string; answer: string; attachmentName?: string }[];
}): Promise<AssessmentOutcome> {
  const response = await request<ApiAssessmentOutcome>(`/students/${input.studentId}/assessment/submit`, {
    method: "POST",
    body: JSON.stringify({
      assessment_id: input.assessmentId,
      target_job: input.targetJob,
      target_profile: {
        target_role: input.targetProfile.targetRole,
        business_focus: input.targetProfile.businessFocus,
        personal_edge: input.targetProfile.personalEdge,
        challenge_boundary: input.targetProfile.challengeBoundary,
        success_signal: input.targetProfile.successSignal,
      },
      answers: input.answers.map((item) => ({
        question_id: item.questionId,
        answer: item.answer,
        attachment_name: item.attachmentName,
      })),
    }),
  });
  return mapAssessmentOutcome(response);
}

export async function submitStudentApplication(input: {
  studentId: string;
  jobId: string;
  jobTitle: string;
  company: string;
  resumeName: string;
  resumeText: string;
  targetJob: string;
  targetProfile: TargetProfile;
  resumeAnalysis: ResumeAnalysis;
  assessmentResult: AssessmentOutcome;
}): Promise<ApplicationSubmitResult> {
  const response = await request<ApiApplicationSubmitResult>(`/students/${input.studentId}/applications/submit`, {
    method: "POST",
    body: JSON.stringify({
      job_id: input.jobId,
      job_title: input.jobTitle,
      company: input.company,
      resume_name: input.resumeName,
      resume_text: input.resumeText,
      target_job: input.targetJob,
      target_profile: {
        target_role: input.targetProfile.targetRole,
        business_focus: input.targetProfile.businessFocus,
        personal_edge: input.targetProfile.personalEdge,
        challenge_boundary: input.targetProfile.challengeBoundary,
        success_signal: input.targetProfile.successSignal,
      },
      resume_analysis: {
        analysis_id: input.resumeAnalysis.analysisId,
        student_id: input.resumeAnalysis.studentId,
        resume_name: input.resumeAnalysis.resumeName,
        target_job: input.resumeAnalysis.targetJob,
        extracted: {
          candidate_name: input.resumeAnalysis.extracted.candidateName,
          education: input.resumeAnalysis.extracted.education,
          skills: input.resumeAnalysis.extracted.skills,
          projects: input.resumeAnalysis.extracted.projects,
          internship_experience: input.resumeAnalysis.extracted.internshipExperience,
        },
        analysis: {
          fit_score: input.resumeAnalysis.analysis.fitScore,
          fit_summary: input.resumeAnalysis.analysis.fitSummary,
          highlights: input.resumeAnalysis.analysis.highlights,
          risks: input.resumeAnalysis.analysis.risks,
          suggestions: input.resumeAnalysis.analysis.suggestions,
        },
        created_at: input.resumeAnalysis.createdAt,
      },
      assessment_result: {
        assessment_id: input.assessmentResult.assessmentId,
        overall_score: input.assessmentResult.overallScore,
        summary: input.assessmentResult.summary,
        dimensions: input.assessmentResult.dimensions.map((item) => ({
          dimension: item.dimension,
          score: item.score,
          comment: item.comment,
        })),
        recommendations: input.assessmentResult.recommendations,
        created_at: input.assessmentResult.createdAt,
      },
    }),
  });

  return {
    studentId: response.student_id,
    application: {
      id: response.application.id,
      job: response.application.job,
      company: response.application.company,
      status: response.application.status,
      date: response.application.date,
      resumeName: response.application.resume_name,
      resumeFitScore: response.application.resume_fit_score,
      assessmentScore: response.application.assessment_score,
      hasAssessment: response.application.has_assessment,
    },
    package: mapApplicationPackage(response.package),
  };
}

export async function startSimulationEpisode(input: {
  studentId: string;
  simulationType: "growth" | "job";
  target: string;
}): Promise<SimulationEpisode> {
  const response = await request<ApiSimulationEpisode>("/simulations/episode/start", {
    method: "POST",
    body: JSON.stringify({
      student_id: input.studentId,
      simulation_type: input.simulationType,
      target: input.target,
    }),
  });
  return mapEpisode(response);
}

export async function getSimulationEpisode(episodeId: string): Promise<SimulationEpisode> {
  const response = await request<ApiSimulationEpisode>(`/simulations/episode/${episodeId}`);
  return mapEpisode(response);
}

export async function actSimulationEpisode(episodeId: string, choice: string): Promise<{ episode: SimulationEpisode; finished: boolean }> {
  const response = await request<ApiEpisodeActionResponse>(`/simulations/episode/${episodeId}/action`, {
    method: "POST",
    body: JSON.stringify({ choice, user_response: choice }),
  });
  return {
    episode: mapEpisode(response.episode),
    finished: response.finished,
  };
}

export async function talkSimulationEpisode(episodeId: string, message: string): Promise<{ reply: string; dialogue: EpisodeDialogueMessage[] }> {
  const response = await request<ApiEpisodeDialogueResponse>(`/simulations/episode/${episodeId}/talk`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return {
    reply: response.reply,
    dialogue: response.dialogue.map((item) => ({
      speaker: item.speaker,
      content: item.content,
      timestamp: item.timestamp,
    })),
  };
}

export async function startSimulationAgent(
  input: {
    studentId: string;
    simulationType: "growth" | "job";
    target: string;
  },
  options?: { onTrace?: (line: string) => void; stream?: boolean },
): Promise<import("@/lib/types").AgentStepResult> {
  if (options?.stream !== false) {
    const { startSimulationAgentStream } = await import("@/lib/simulation-agent/stream-client");
    return startSimulationAgentStream(input, { onTrace: options?.onTrace });
  }
  const res = await fetch("/api/simulations/agent/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string; code?: string; retryable?: boolean };
    throw new Error(err.error ?? "Agent 启动失败");
  }
  return res.json();
}

export async function actSimulationAgent(
  episodeId: string,
  choice: string,
  options?: { onTrace?: (line: string) => void; stream?: boolean },
): Promise<import("@/lib/types").AgentStepResult> {
  if (options?.stream !== false) {
    const { actSimulationAgentStream } = await import("@/lib/simulation-agent/stream-client");
    return actSimulationAgentStream(episodeId, choice, { onTrace: options?.onTrace });
  }
  const res = await fetch("/api/simulations/agent/act", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ episodeId, choice }),
    cache: "no-store",
  });
  if (!res.ok) {
    const err = (await res.json()) as { error?: string; code?: string; retryable?: boolean };
    throw new Error(err.error ?? "Agent 回合失败");
  }
  return res.json();
}

export async function getLifeMemories(studentId: string, limit = 20): Promise<import("@/lib/types").LifeMemory[]> {
  try {
    const response = await request<{ student_id: string; items: { memory_id: string; memory_text: string; keywords: string[]; importance: number; episode_id: string | null; created_at: string | null }[] }>(
      `/simulations/memories?student_id=${studentId}&limit=${limit}`,
    );
    return response.items.map((item) => ({
      memoryId: item.memory_id,
      memoryText: item.memory_text,
      keywords: item.keywords,
      importance: item.importance,
      episodeId: item.episode_id,
      createdAt: item.created_at,
    }));
  } catch {
    return [];
  }
}

export async function deleteLifeMemory(memoryId: string): Promise<void> {
  await request(`/simulations/memories/${memoryId}`, { method: "DELETE" });
}

export async function optimizeResumeWithAgent(input: {
  studentId: string;
  originalResume: string;
  targetJob: string;
  iterations?: number;
  playerStrategy?: "conservative" | "aggressive" | "random";
  scoreTarget?: number;
  stream?: boolean;
  onTrace?: (line: string) => void;
  onTurn?: (event: import("@/components/simulator/auto-run-progress-panel").AutoRunTurnEvent) => void;
}): Promise<import("@/lib/types").ResumeOptimizeResult> {
  const useStream = input.stream !== false;
  const res = await fetch("/api/resume/optimize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, stream: useStream }),
    cache: "no-store",
  });

  if (useStream && res.headers.get("content-type")?.includes("text/event-stream")) {
    const { consumeResumeOptimizeSse } = await import("@/lib/simulation-agent/auto-run-stream-client");
    return consumeResumeOptimizeSse(res, {
      onTrace: input.onTrace,
      onTurn: input.onTurn,
    });
  }

  if (!res.ok) {
    const err = (await res.json()) as { error?: string };
    throw new Error(err.error ?? "简历优化失败");
  }
  return res.json();
}

type EnterpriseDashboardData = {
  metrics: { title: string; value: string; delta: string; hint: string }[];
  warnings: { message: string }[];
  funnel: { stage: string; value: number }[];
  gap_words: string[];
};

type EnterpriseJobsCenterData = {
  templates: { name: string; dept: string; use_count: string }[];
  default_weights: Record<string, number>;
  default_required_skills: string[];
};

type EnterpriseJobModelActionResponse = {
  model_id: string;
  job_name: string;
  department: string;
  level: string;
  work_mode: string;
  required_skills: string[];
  weights: Record<string, number>;
  summary: string;
  interview_questions: string[];
  engine: string;
  saved: boolean;
  created_at: string;
};

type EnterpriseRecruitmentData = {
  flow: { stage: string; count: number; owner: string; sla: string }[];
  templates: { stage: string; ability: string; question: string }[];
};

type EnterpriseAnalyticsData = {
  channel_rows: { channel: string; conversion: number; quality: string; schools: string; note: string }[];
  heat_rows: { school: string; applicants: number; fit: string; gap: string }[];
  gap_trend: Record<string, number>;
};

type EnterprisePartnershipsData = {
  schools: { school: string; active: number; fit: string; contact: string; score: string }[];
  activities: { date: string; item: string; owner: string; status: string }[];
};

type EnterpriseSettingsData = {
  role_rows: { role: string; perms: string; scope: string }[];
  governance_rows: { item: string; rule: string }[];
};

type ApiEnterpriseApplicationListItem = {
  application_id: string;
  student_id: string;
  job_id?: string | null;
  company_id?: string | null;
  job_title: string;
  company: string;
  status: string;
  applied_at: string;
  resume_name?: string | null;
  resume_fit_score?: number | null;
  assessment_score?: number | null;
};

type ApiEnterpriseApplicationsResponse = {
  items: ApiEnterpriseApplicationListItem[];
};

type ApiEnterpriseApplicationPackageResponse = {
  package: ApiApplicationPackage | null;
};

type SchoolDashboardData = {
  metrics: { title: string; value: string; delta: string; hint: string }[];
  major_gaps: { major: string; gap: string; level: string }[];
};

type SchoolCurriculumData = {
  map_rows: { course: string; ability: string; contribution: string; market: string }[];
  optimize_suggestions: string[];
};

type SchoolCurriculumOptimizeResponse = {
  plan_id: string;
  major: string;
  objective: string;
  map_rows: { course: string; ability: string; contribution: string; market: string }[];
  optimize_suggestions: string[];
  engine: string;
  saved: boolean;
  created_at: string;
};

type SchoolProjectsData = {
  projects: { name: string; need: string; slots: number; status: string }[];
};

type SchoolEmploymentData = {
  major_rows: { major: string; target: string; match: string; quality: string }[];
};

type SchoolInterventionsData = {
  strategies: { level: string; strategy: string; owner: string }[];
  rules: string[];
};

type SchoolPartnershipsData = {
  partners: { company: string; focus: string; status: string }[];
  feedback_rows: { company: string; praise: string; gap: string; priority: string }[];
};

type SchoolAnalyticsData = {
  report_rows: { type: string; focus: string; output: string }[];
};

type SchoolSettingsData = {
  role_rows: { role: string; perms: string; scope: string }[];
  governance_rows: { item: string; rule: string }[];
};

export async function getEnterpriseDashboardData(token: string | null): Promise<EnterpriseDashboardData> {
  return await authedRequest<EnterpriseDashboardData>("/enterprise/dashboard", token);
}

export async function getEnterpriseJobsCenterData(token: string | null): Promise<EnterpriseJobsCenterData> {
  return await authedRequest<EnterpriseJobsCenterData>("/enterprise/jobs-center", token);
}

export async function generateEnterpriseJobModel(token: string | null, input: {
  jobName: string;
  department: string;
  level: string;
  workMode: string;
  requiredSkills: string[];
  weightHints: Record<string, number>;
  description: string;
}) {
  const payload = {
    job_name: input.jobName,
    department: input.department,
    level: input.level,
    work_mode: input.workMode,
    required_skills: input.requiredSkills,
    weight_hints: input.weightHints,
    description: input.description,
  };
  const response =
    !token && typeof window !== "undefined"
      ? await (async () => {
          const res = await fetch("/api/enterprise/jobs-center/generate-model", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`API request failed: ${res.status}`);
          return (await res.json()) as EnterpriseJobModelActionResponse;
        })()
      : await authedRequest<EnterpriseJobModelActionResponse>("/enterprise/jobs-center/generate-model", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
  return {
    modelId: response.model_id,
    jobName: response.job_name,
    department: response.department,
    level: response.level,
    workMode: response.work_mode,
    requiredSkills: response.required_skills,
    weights: response.weights,
    summary: response.summary,
    interviewQuestions: response.interview_questions,
    engine: response.engine,
    saved: response.saved,
    createdAt: response.created_at,
  };
}

export async function saveEnterpriseJobModel(token: string | null, input: {
  jobName: string;
  department: string;
  level: string;
  workMode: string;
  requiredSkills: string[];
  weights: Record<string, number>;
  summary: string;
  interviewQuestions: string[];
}) {
  const payload = {
    job_name: input.jobName,
    department: input.department,
    level: input.level,
    work_mode: input.workMode,
    required_skills: input.requiredSkills,
    weights: input.weights,
    summary: input.summary,
    interview_questions: input.interviewQuestions,
  };
  const response =
    !token && typeof window !== "undefined"
      ? await (async () => {
          const res = await fetch("/api/enterprise/jobs-center/save-model", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error(`API request failed: ${res.status}`);
          return (await res.json()) as EnterpriseJobModelActionResponse;
        })()
      : await authedRequest<EnterpriseJobModelActionResponse>("/enterprise/jobs-center/save-model", token, {
          method: "POST",
          body: JSON.stringify(payload),
        });
  return {
    modelId: response.model_id,
    jobName: response.job_name,
    department: response.department,
    level: response.level,
    workMode: response.work_mode,
    requiredSkills: response.required_skills,
    weights: response.weights,
    summary: response.summary,
    interviewQuestions: response.interview_questions,
    engine: response.engine,
    saved: response.saved,
    createdAt: response.created_at,
  };
}

export async function getEnterpriseRecruitmentData(token: string | null): Promise<EnterpriseRecruitmentData> {
  return await authedRequest<EnterpriseRecruitmentData>("/enterprise/recruitment", token);
}

export async function getEnterpriseAnalyticsData(token: string | null): Promise<EnterpriseAnalyticsData> {
  return await authedRequest<EnterpriseAnalyticsData>("/enterprise/analytics", token);
}

export async function filterEnterpriseAnalytics(token: string | null, input: {
  jobFamily: string;
  school: string;
  abilityGap: string;
  timeRange: string;
}): Promise<EnterpriseAnalyticsData> {
  if (!token && typeof window !== "undefined") {
    return await request<EnterpriseAnalyticsData>("/api/enterprise/analytics/filter", {
      method: "POST",
      body: JSON.stringify({
        job_family: input.jobFamily,
        school: input.school,
        ability_gap: input.abilityGap,
        time_range: input.timeRange,
      }),
    });
  }
  return await authedRequest<EnterpriseAnalyticsData>("/enterprise/analytics/filter", token, {
    method: "POST",
    body: JSON.stringify({
      job_family: input.jobFamily,
      school: input.school,
      ability_gap: input.abilityGap,
      time_range: input.timeRange,
    }),
  });
}

export async function submitEnterpriseRecruitmentFeedback(token: string | null, input: {
  candidateId: string;
  jobId: string;
  businessScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  conclusion: string;
  draft?: boolean;
}) {
  if (!token && typeof window !== "undefined") {
    return await request<{ feedback_id: string; saved: boolean; draft: boolean; created_at: string }>("/api/enterprise/recruitment/feedback", {
      method: "POST",
      body: JSON.stringify({
        candidate_id: input.candidateId,
        job_id: input.jobId,
        business_score: input.businessScore,
        communication_score: input.communicationScore,
        problem_solving_score: input.problemSolvingScore,
        conclusion: input.conclusion,
        draft: Boolean(input.draft),
      }),
    });
  }
  return await authedRequest<{ feedback_id: string; saved: boolean; draft: boolean; created_at: string }>("/enterprise/recruitment/feedback", token, {
    method: "POST",
    body: JSON.stringify({
      candidate_id: input.candidateId,
      job_id: input.jobId,
      business_score: input.businessScore,
      communication_score: input.communicationScore,
      problem_solving_score: input.problemSolvingScore,
      conclusion: input.conclusion,
      draft: Boolean(input.draft),
    }),
  });
}

export async function getEnterprisePartnershipsData(token: string | null): Promise<EnterprisePartnershipsData> {
  return await authedRequest<EnterprisePartnershipsData>("/enterprise/partnerships", token);
}

export async function queryEnterprisePartnerships(token: string | null, query: string): Promise<EnterprisePartnershipsData> {
  if (!token && typeof window !== "undefined") {
    return await request<EnterprisePartnershipsData>("/api/enterprise/partnerships/query", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  }
  return await authedRequest<EnterprisePartnershipsData>("/enterprise/partnerships/query", token, {
    method: "POST",
    body: JSON.stringify({ query }),
  });
}

export async function getEnterpriseSettingsData(token: string | null): Promise<EnterpriseSettingsData> {
  return await authedRequest<EnterpriseSettingsData>("/enterprise/settings", token);
}

export async function saveEnterpriseSettingsData(token: string | null, input: {
  roleRows: { role: string; perms: string; scope: string }[];
  governanceRows: { item: string; rule: string }[];
}) {
  if (!token && typeof window !== "undefined") {
    return await request<{ saved: boolean; updated_at: string }>("/api/enterprise/settings", {
      method: "POST",
      body: JSON.stringify({
        role_rows: input.roleRows,
        governance_rows: input.governanceRows,
      }),
    });
  }
  return await authedRequest<{ saved: boolean; updated_at: string }>("/enterprise/settings", token, {
    method: "POST",
    body: JSON.stringify({
      role_rows: input.roleRows,
      governance_rows: input.governanceRows,
    }),
  });
}

export async function getEnterpriseApplications(
  token: string | null,
  filters?: { jobId?: string; status?: string; keyword?: string; limit?: number; offset?: number },
): Promise<EnterpriseApplication[]> {
  const params = new URLSearchParams();
  if (filters?.jobId) params.set("job_id", filters.jobId);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.keyword) params.set("keyword", filters.keyword);
  if (typeof filters?.limit === "number") params.set("limit", String(filters.limit));
  if (typeof filters?.offset === "number") params.set("offset", String(filters.offset));
  const query = params.toString() ? `?${params.toString()}` : "";
  const response = await authedRequest<ApiEnterpriseApplicationsResponse>(`/enterprise/applications${query}`, token);
  return response.items.map((it) => ({
    applicationId: it.application_id,
    studentId: it.student_id,
    jobId: it.job_id ?? undefined,
    companyId: it.company_id ?? undefined,
    jobTitle: it.job_title,
    company: it.company,
    status: it.status,
    appliedAt: it.applied_at,
    resumeName: it.resume_name ?? undefined,
    resumeFitScore: it.resume_fit_score ?? undefined,
    assessmentScore: it.assessment_score ?? undefined,
  }));
}

export async function getEnterpriseApplicationPackage(token: string | null, applicationId: string): Promise<ApplicationPackage | null> {
  const response = await authedRequest<ApiEnterpriseApplicationPackageResponse>(`/enterprise/applications/${applicationId}/package`, token);
  return response.package ? mapApplicationPackage(response.package) : null;
}

export async function getSchoolDashboardData(): Promise<SchoolDashboardData> {
  return await request<SchoolDashboardData>("/school/dashboard");
}

export async function getSchoolCurriculumData(): Promise<SchoolCurriculumData> {
  return await request<SchoolCurriculumData>("/school/curriculum");
}

export async function optimizeSchoolCurriculum(input: {
  major: string;
  objective: string;
  contextNote: string;
  currentRows: { course: string; ability: string; contribution: string; market: string }[];
}) {
  const response = await request<SchoolCurriculumOptimizeResponse>("/school/curriculum/optimize", {
    method: "POST",
    body: JSON.stringify({
      major: input.major,
      objective: input.objective,
      context_note: input.contextNote,
      current_rows: input.currentRows,
    }),
  });
  return {
    planId: response.plan_id,
    major: response.major,
    objective: response.objective,
    mapRows: response.map_rows,
    optimizeSuggestions: response.optimize_suggestions,
    engine: response.engine,
    saved: response.saved,
    createdAt: response.created_at,
  };
}

export async function getSchoolProjectsData(): Promise<SchoolProjectsData> {
  return await request<SchoolProjectsData>("/school/projects");
}

export async function publishSchoolProject(input: {
  name: string;
  need: string;
  slots: number;
  status: string;
}) {
  return await request<{ project_id: string; name: string; need: string; slots: number; status: string; saved: boolean; created_at: string }>("/school/projects/publish", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      need: input.need,
      slots: input.slots,
      status: input.status,
    }),
  });
}

export async function generateSchoolProjectQuestions(input: { name: string; need: string }) {
  return await request<{ questions: string[]; engine: string }>("/school/projects/generate-questions", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      need: input.need,
    }),
  });
}

export async function getSchoolEmploymentData(): Promise<SchoolEmploymentData> {
  return await request<SchoolEmploymentData>("/school/employment");
}

export async function getSchoolInterventionsData(): Promise<SchoolInterventionsData> {
  return await request<SchoolInterventionsData>("/school/interventions");
}

export async function getSchoolPartnershipsData(): Promise<SchoolPartnershipsData> {
  return await request<SchoolPartnershipsData>("/school/partnerships");
}

export async function getSchoolAnalyticsData(): Promise<SchoolAnalyticsData> {
  return await request<SchoolAnalyticsData>("/school/analytics");
}

export async function exportSchoolAnalytics(input: {
  timeRange: string;
  school: string;
  major: string;
  version: string;
  exportType: string;
}) {
  return await request<{ export_id: string; export_type: string; saved: boolean; created_at: string }>("/school/analytics/export", {
    method: "POST",
    body: JSON.stringify({
      time_range: input.timeRange,
      school: input.school,
      major: input.major,
      version: input.version,
      export_type: input.exportType,
    }),
  });
}

export async function getSchoolSettingsData(): Promise<SchoolSettingsData> {
  return await request<SchoolSettingsData>("/school/settings");
}

export async function saveSchoolSettingsData(input: {
  roleRows: { role: string; perms: string; scope: string }[];
  governanceRows: { item: string; rule: string }[];
}) {
  return await request<{ saved: boolean; updated_at: string }>("/school/settings", {
    method: "POST",
    body: JSON.stringify({
      role_rows: input.roleRows,
      governance_rows: input.governanceRows,
    }),
  });
}





