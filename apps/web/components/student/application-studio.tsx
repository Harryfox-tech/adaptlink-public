"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import {
  actSimulationEpisode,
  analyzeStudentResume,
  extractStudentResumeFromFile,
  startSimulationEpisode,
  submitStudentApplication,
  talkSimulationEpisode,
} from "@/lib/api/client";
import { AssessmentOutcome, ResumeAnalysis, SimulationEpisode, StudentApplication, TargetProfile } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/neo/glass-card";

type SelectedJob = {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore?: number;
};

type ProgressMeta = {
  active: boolean;
  value: number;
  stage: string;
};

type StageItem = {
  label: string;
  durationMs: number;
};

const TOOL_OPTIONS = ["Excel", "SQL", "Python", "Figma", "Notion", "Tableau"] as const;

const PROFILE_FIELDS: { key: keyof TargetProfile; label: string; placeholder: string }[] = [
  { key: "targetRole", label: "目标角色", placeholder: "例如：产品运营专员" },
  { key: "businessFocus", label: "业务目标", placeholder: "例如：提升转化率、提升留存、缩短交付周期" },
  { key: "personalEdge", label: "个人优势证据", placeholder: "例如：项目成绩、工具能力、协作成果" },
  { key: "challengeBoundary", label: "挑战边界", placeholder: "例如：高压追问下表达不够结构化" },
  { key: "successSignal", label: "成功信号", placeholder: "例如：进入下一轮并获得岗位匹配正反馈" },
];

function inferAssessmentNeeds(jobText: string) {
  const text = jobText.toLowerCase();
  const codeNeed = /开发|工程|程序|前端|后端|算法|测试|技术|data engineer|software|developer|engineer|coding|python|java|cpp/.test(text);
  const toolNeed = /运营|分析|产品|增长|市场|项目|商分|数据|策划|投放|内容|operation|analyst|product|marketing|project/.test(text);
  return { codeNeed, toolNeed };
}

function inferToolSelection(jobText: string) {
  const text = jobText.toLowerCase();
  const picks: string[] = [];
  if (/数据|分析|analyst|data|sql/.test(text)) picks.push("SQL", "Excel", "Tableau");
  if (/产品|项目|product|project/.test(text)) picks.push("Notion", "Excel");
  if (/设计|原型|design|figma/.test(text)) picks.push("Figma");
  if (/开发|工程|python|developer|engineer/.test(text)) picks.push("Python");
  return Array.from(new Set(picks)).filter((item) => TOOL_OPTIONS.includes(item as (typeof TOOL_OPTIONS)[number]));
}

export function ApplicationStudio({
  initialItems,
  selectedJob,
}: {
  initialItems: StudentApplication[];
  selectedJob?: SelectedJob;
}) {
  const [jobId, setJobId] = useState(selectedJob?.jobId ?? "job_custom_001");
  const [jobTitle, setJobTitle] = useState(selectedJob?.jobTitle ?? "产品运营专员");
  const [company, setCompany] = useState(selectedJob?.company ?? "星澜科技");
  const [targetJob, setTargetJob] = useState(selectedJob?.jobTitle ?? "产品运营专员");

  const [resumeName, setResumeName] = useState("我的简历.pdf");
  const [resumeText, setResumeText] = useState("");
  const [profile, setProfile] = useState<TargetProfile>({
    targetRole: selectedJob?.jobTitle || "产品运营专员",
    businessFocus: "用户增长与活动转化",
    personalEdge: "有项目运营经验，熟悉数据复盘",
    challengeBoundary: "高压追问时表达还不够结构化",
    successSignal: "获得面试官认可并进入下一轮",
  });

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [episode, setEpisode] = useState<SimulationEpisode | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [talkInput, setTalkInput] = useState("");
  const [outcome, setOutcome] = useState<AssessmentOutcome | null>(null);
  const [applications, setApplications] = useState<StudentApplication[]>(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [progress, setProgress] = useState<ProgressMeta>({ active: false, value: 0, stage: "待命" });

  const [codeNeed, setCodeNeed] = useState(false);
  const [toolNeed, setToolNeed] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState("");
  const [toolSelection, setToolSelection] = useState<string[]>([]);
  const [toolMethod, setToolMethod] = useState("");

  const latestTurn = useMemo(() => (episode?.turns.length ? episode.turns[episode.turns.length - 1] : null), [episode]);
  const canApply = Boolean(analysis && outcome && jobTitle.trim() && company.trim() && resumeText.trim());

  const applyAutoAssessmentRule = (sourceText: string) => {
    const inferred = inferAssessmentNeeds(sourceText);
    const inferredTools = inferToolSelection(sourceText);
    setCodeNeed(inferred.codeNeed);
    setToolNeed(inferred.toolNeed);
    setToolSelection(inferred.toolNeed ? inferredTools : []);
    if (!inferred.toolNeed) setToolMethod("");
    if (!inferred.codeNeed) setCodeSnippet("");
  };

  useEffect(() => {
    const source = `${jobTitle} ${targetJob}`;
    applyAutoAssessmentRule(source);
    // only auto-apply when selected job changes or first render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedJob?.jobId]);

  const completionRate = useMemo(() => {
    const chunks = [
      Number(Boolean(resumeText.trim())),
      Number(Boolean(analysis)),
      Number(Boolean(episode)),
      Number(Boolean(outcome)),
      Number(Boolean(jobTitle.trim() && company.trim())),
      Number(Boolean(!codeNeed || codeSnippet.trim())),
      Number(Boolean(!toolNeed || (toolSelection.length && toolMethod.trim()))),
    ];
    return Math.round((chunks.reduce((sum, n) => sum + n, 0) / chunks.length) * 100);
  }, [resumeText, analysis, episode, outcome, jobTitle, company, codeNeed, codeSnippet, toolNeed, toolSelection, toolMethod]);

  const withProgress = async <T,>(stages: StageItem[], task: () => Promise<T>) => {
    setError(null);
    setHint(null);
    const total = stages.reduce((sum, item) => sum + item.durationMs, 0);
    const started = Date.now();
    setProgress({ active: true, value: 6, stage: stages[0]?.label ?? "处理中" });
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      let cursor = 0;
      let remain = elapsed;
      for (const stage of stages) {
        if (remain <= stage.durationMs) break;
        remain -= stage.durationMs;
        cursor += 1;
      }
      const ratio = Math.min(0.95, elapsed / Math.max(700, total));
      setProgress({
        active: true,
        value: Math.round(Math.max(6, ratio * 95)),
        stage: stages[Math.min(cursor, stages.length - 1)]?.label ?? "处理中",
      });
    }, 120);
    try {
      const result = await task();
      setProgress({ active: true, value: 100, stage: "完成" });
      return result;
    } finally {
      clearInterval(timer);
      setTimeout(() => setProgress({ active: false, value: 0, stage: "待命" }), 900);
    }
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setResumeName(file.name);
    try {
      const extracted = await withProgress(
        [
          { label: "读取简历文件", durationMs: 500 },
          { label: "提取可读文本", durationMs: 1000 },
          { label: "回填简历内容", durationMs: 500 },
        ],
        () => extractStudentResumeFromFile({ studentId: "stu_001", file }),
      );
      setResumeText(extracted.extractedText);
      setHint(`已提取 ${extracted.charCount} 字（${extracted.fileType.toUpperCase()}）`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "文件提取失败");
    }
  };

  const handleCodeUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setCodeSnippet(text.slice(0, 6000));
      setHint(`已读取代码片段：${file.name}`);
    } catch {
      setError("代码文件读取失败");
    }
  };

  const startResumeAnalysis = async () => {
    if (!resumeText.trim()) {
      setHint("请先上传简历文件（PDF/DOCX/TXT）或粘贴简历文本。");
      return;
    }
    try {
      const result = await withProgress(
        [
          { label: "解析简历结构", durationMs: 900 },
          { label: "匹配岗位关键词", durationMs: 1000 },
          { label: "生成 HR 建议", durationMs: 1100 },
        ],
        () => analyzeStudentResume({ studentId: "stu_001", resumeName, resumeText, targetJob }),
      );
      setAnalysis(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "简历解析失败");
    }
  };

  const startAssessment = async () => {
    if (!analysis) {
      setHint("请先完成简历 AI 解析，再启动他测剧情。");
      return;
    }
    if (codeNeed && !codeSnippet.trim()) {
      setHint("该岗位要求代码能力，请先上传或粘贴代码片段。");
      return;
    }
    if (toolNeed && (!toolSelection.length || !toolMethod.trim())) {
      setHint("该岗位要求工具能力，请先选择工具并填写方法说明。");
      return;
    }

    const objective = [
      `是否要求代码能力：${codeNeed ? "是" : "否"}`,
      codeNeed ? `代码样本：${codeSnippet.length} 字` : "代码样本：无",
      `是否要求工具能力：${toolNeed ? "是" : "否"}`,
      toolNeed ? `工具清单：${toolSelection.join("、")}` : "工具清单：无",
      toolNeed ? `工具方法：${toolMethod}` : "工具方法：无",
    ].join("；");

    const target = [
      `目标岗位：${targetJob}`,
      `岗位ID：${jobId}`,
      `企业：${company}`,
      selectedJob?.matchScore ? `推荐匹配度：${selectedJob.matchScore}` : "",
      `目标角色：${profile.targetRole}`,
      `业务目标：${profile.businessFocus}`,
      `优势证据：${profile.personalEdge}`,
      `挑战边界：${profile.challengeBoundary}`,
      `成功信号：${profile.successSignal}`,
      `客观能力考察：${objective}`,
    ]
      .filter(Boolean)
      .join("；");

    try {
      const created = await withProgress(
        [
          { label: "构建岗位定制剧情", durationMs: 900 },
          { label: "生成角色发问", durationMs: 1200 },
          { label: "初始化评分看板", durationMs: 800 },
        ],
        () => startSimulationEpisode({ studentId: "stu_001", simulationType: "job", target }),
      );
      setEpisode(created);
      setAnswerInput("");
      setTalkInput("");
      setOutcome(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "启动他测失败");
    }
  };

  const buildOutcome = (ep: SimulationEpisode): AssessmentOutcome => {
    const last = ep.turns[ep.turns.length - 1];
    const avg = ep.turns.length > 0 ? Number((ep.turns.reduce((sum, item) => sum + item.aggregate.overallScore, 0) / ep.turns.length).toFixed(1)) : 0;
    const objectiveSummary = [
      codeNeed ? `代码能力已考察（样本${codeSnippet.length}字）` : "代码能力未纳入",
      toolNeed ? `工具能力已考察（${toolSelection.join("、")}）` : "工具能力未纳入",
    ].join("；");
    return {
      assessmentId: ep.episodeId,
      overallScore: avg,
      summary: `${ep.ending?.summary ?? last?.aggregate.summary ?? "评估完成"}；${objectiveSummary}`,
      dimensions:
        last?.aggregate.abilityScores.map((item) => ({
          dimension: item.label,
          score: item.score,
          comment: item.trend === "up" ? "趋势上升" : item.trend === "flat" ? "保持稳定" : "存在下滑",
        })) ?? [],
      recommendations: [...(last?.aggregate.recommendations ?? []), ...(ep.ending?.nextSteps ?? []), objectiveSummary],
      createdAt: new Date().toISOString(),
    };
  };

  const submitTurn = async () => {
    if (!episode || !answerInput.trim()) return;
    try {
      const next = await withProgress(
        [
          { label: "解析回答", durationMs: 900 },
          { label: "计算分数", durationMs: 1200 },
          { label: "刷新下一问", durationMs: 900 },
        ],
        () => actSimulationEpisode(episode.episodeId, answerInput.trim()),
      );
      setEpisode(next.episode);
      setAnswerInput("");
      if (next.finished) {
        setOutcome(buildOutcome(next.episode));
        setHint("他测完成，已生成评估结果。");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "提交回合失败");
    }
  };

  const askRole = async () => {
    if (!episode || !talkInput.trim()) return;
    try {
      const response = await withProgress(
        [
          { label: "理解追问语义", durationMs: 700 },
          { label: "角色组织回复", durationMs: 900 },
          { label: "同步上下文", durationMs: 500 },
        ],
        () => talkSimulationEpisode(episode.episodeId, talkInput.trim()),
      );
      setEpisode({ ...episode, dialogue: response.dialogue });
      setTalkInput("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "追问失败");
    }
  };

  const submitBundle = async () => {
    if (!analysis || !outcome) {
      setHint("请先完成简历解析和岗位定制他测。");
      return;
    }
    if (!canApply) {
      setHint("请检查岗位信息、企业名称和简历内容是否完整。");
      return;
    }
    const profileEnhanced: TargetProfile = {
      ...profile,
      personalEdge: `${profile.personalEdge}；客观考察：${codeNeed ? "代码" : "无代码"} / ${toolNeed ? `工具(${toolSelection.join("、")})` : "无工具"}`,
    };
    try {
      const result = await withProgress(
        [
          { label: "封装投递包", durationMs: 700 },
          { label: "同步解析与评估", durationMs: 1100 },
          { label: "推送企业端", durationMs: 900 },
        ],
        () =>
          submitStudentApplication({
            studentId: "stu_001",
            jobId,
            jobTitle,
            company,
            resumeName,
            resumeText,
            targetJob,
            targetProfile: profileEnhanced,
            resumeAnalysis: analysis,
            assessmentResult: outcome,
          }),
      );
      setApplications((prev) => [result.application, ...prev]);
      setHint("投递成功，企业端已可查看完整材料。");
    } catch (e) {
      setError(e instanceof Error ? e.message : "投递失败");
    }
  };

  return (
    <div className="space-y-5">
      <GlassCard className="overflow-hidden px-6 py-5">
        <div className="text-3xl font-semibold tracking-tight text-white md:text-4xl">简历分析看板</div>
        <div className="mt-1 text-sm text-white/55">上传简历 → AI 解析 → 岗位定制他测 → 企业端投递包同步</div>
        <div className="mt-4 space-y-3">
          <div className="grid items-center gap-4 lg:grid-cols-[1fr_520px]">
            <div className="space-y-2">
              <p className="text-sm text-white/60">你现在看到的是暗色玻璃版工作台（不改逻辑，只换皮）。</p>
              {selectedJob ? (
                <div className="rounded-[16px] border border-white/10 bg-white/5 p-3 text-xs text-white/65">
                  已选岗位：{selectedJob.jobTitle} / {selectedJob.company}
                  {typeof selectedJob.matchScore === "number" ? ` / 推荐匹配度 ${selectedJob.matchScore}%` : ""}
                </div>
              ) : null}
            </div>
            <div className="h-40 overflow-hidden">
              <Image src="/pic/job.png" alt="岗位投递场景" width={1000} height={400} className="page-bg-blend h-full w-full object-contain object-right" />
            </div>
          </div>
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between text-xs text-white/55">
              <span>流程完成度</span>
              <span>{completionRate}%</span>
            </div>
            <Progress value={completionRate} className="bg-white/10" />
          </div>
          {progress.active ? (
            <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
              <p className="text-xs text-white/55">{progress.stage}</p>
              <Progress value={progress.value} className="mt-2 bg-white/10" />
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">岗位与目标描述</div>
        <div className="mt-4 space-y-3">
          <Input className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="岗位ID" />
          <Input className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="岗位名称" />
          <Input className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="企业名称" />
          <Input className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={targetJob} onChange={(e) => setTargetJob(e.target.value)} placeholder="目标岗位（用于岗位定制他测）" />
          <div className="flex flex-wrap items-center gap-2 rounded-[16px] border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/55">岗位要求自动识别：</p>
            <Badge className={codeNeed ? "border border-cyan-300/20 bg-cyan-500/10 text-cyan-200" : "border border-white/10 bg-white/5 text-white/60"}>{codeNeed ? "代码能力：需要" : "代码能力：可选"}</Badge>
            <Badge className={toolNeed ? "border border-cyan-300/20 bg-cyan-500/10 text-cyan-200" : "border border-white/10 bg-white/5 text-white/60"}>{toolNeed ? "工具能力：需要" : "工具能力：可选"}</Badge>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="ml-auto border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
              onClick={() => {
                applyAutoAssessmentRule(`${jobTitle} ${targetJob}`);
                setHint("已按当前岗位重新识别考察项。");
              }}
            >
              重新识别
            </Button>
          </div>
          {PROFILE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <p className="text-xs text-white/55">{field.label}</p>
              <Textarea
                className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                value={profile[field.key]}
                onChange={(e) => setProfile((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">简历上传与解析</div>
        <div className="mt-4 space-y-3">
          <Input className="border border-white/10 bg-white/5 text-white file:text-white/80 placeholder:text-white/35 focus-visible:ring-cyan-300/30" type="file" accept=".pdf,.docx,.txt" onChange={(e) => void handleUpload(e.target.files?.[0] ?? null)} />
          <Input className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={resumeName} onChange={(e) => setResumeName(e.target.value)} placeholder="简历文件名" />
          <Textarea className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30" value={resumeText} onChange={(e) => setResumeText(e.target.value)} placeholder="粘贴简历内容，或先上传文件自动提取。" />
          <Button onClick={startResumeAnalysis} disabled={progress.active} className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25">
            生成 AI 简历解析
          </Button>
          {analysis ? (
            <div className="space-y-3 rounded-[16px] border border-white/10 bg-white/5 p-3">
              <div className="flex flex-wrap gap-2">
                <Badge className="border border-emerald-300/20 bg-emerald-500/10 text-emerald-200">匹配分 {analysis.analysis.fitScore}</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/70">{analysis.targetJob}</Badge>
                <Badge className="border border-white/10 bg-white/5 text-white/70">{analysis.extracted.candidateName}</Badge>
              </div>
              <p className="text-sm text-white/60">{analysis.analysis.fitSummary}</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">客观能力考察（与岗位要求绑定）</div>
        <div className="mt-4 space-y-3">
          {codeNeed ? (
            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-medium text-white/85">代码能力样本</p>
              <Input
                className="border border-white/10 bg-white/5 text-white file:text-white/80 placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                type="file"
                accept=".js,.ts,.py,.java,.cpp,.txt,.md"
                onChange={(e) => void handleCodeUpload(e.target.files?.[0] ?? null)}
              />
              <Textarea
                className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="粘贴关键代码片段，供 AI 分析结构、复杂度与质量。"
              />
            </div>
          ) : (
            <p className="text-sm text-white/55">当前岗位未识别出强制代码能力要求。</p>
          )}

          {toolNeed ? (
            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/5 p-3">
              <p className="text-sm font-medium text-white/85">工具能力考察</p>
              <div className="flex flex-wrap gap-2">
                {TOOL_OPTIONS.map((tool) => (
                  <Button
                    key={tool}
                    type="button"
                    size="sm"
                    variant={toolSelection.includes(tool) ? "default" : "outline"}
                    className={
                      toolSelection.includes(tool)
                        ? "bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25"
                        : "border-white/10 bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
                    }
                    onClick={() =>
                      setToolSelection((prev) => (prev.includes(tool) ? prev.filter((v) => v !== tool) : [...prev, tool]))
                    }
                  >
                    {tool}
                  </Button>
                ))}
              </div>
              <Textarea
                className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                value={toolMethod}
                onChange={(e) => setToolMethod(e.target.value)}
                placeholder="描述你如何用这些工具解决岗位相关问题。"
              />
            </div>
          ) : (
            <p className="text-sm text-white/55">当前岗位未识别出强制工具能力要求。</p>
          )}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">投递前岗位他测（岗位定制）</div>
        <div className="mt-4 space-y-3">
          <Button
            variant="outline"
            className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={startAssessment}
            disabled={progress.active}
          >
            启动岗位定制他测
          </Button>

          {episode ? (
            <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
              <div className="space-y-3 rounded-[16px] border border-white/10 bg-white/5 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border border-white/10 bg-white/10 text-white">
                    阶段 {episode.currentStage}/{episode.totalStages}
                  </Badge>
                  <Badge className="border border-white/10 bg-white/5 text-white/70">{episode.status}</Badge>
                  {episode.currentEvent ? <Badge className="border border-white/10 bg-white/5 text-white/70">{episode.currentEvent.npcRole}</Badge> : null}
                </div>
                <Progress value={(episode.currentStage / episode.totalStages) * 100} className="bg-white/10" />
                {episode.currentEvent ? (
                  <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
                    <p className="font-medium text-white">角色发问：{episode.currentEvent.title}</p>
                    <p className="mt-1 text-sm text-white/60">{episode.currentEvent.description}</p>
                    <p className="mt-2 rounded-[12px] border border-white/10 bg-white/5 p-2 text-sm text-white/70">
                      {episode.currentEvent.openingLine}
                    </p>
                  </div>
                ) : null}

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/85">角色对话</p>
                  <div className="flex gap-3">
                    <div className="w-[78%]">
                      <div className="max-h-64 space-y-2 overflow-y-auto rounded-[16px] border border-white/10 bg-white/5 p-2">
                        {episode.dialogue.map((msg, idx) => (
                          <div key={`${msg.timestamp}-${idx}`} className={msg.speaker === "user" ? "text-right" : "text-left"}>
                            <div
                              className={
                                msg.speaker === "user"
                                  ? "ml-auto inline-block max-w-[88%] rounded-lg border border-cyan-300/20 bg-cyan-500/15 px-3 py-2 text-sm text-white"
                                  : "inline-block max-w-[88%] rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80"
                              }
                            >
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="hidden flex-1 rounded-[16px] border border-white/10 bg-white/5 xl:block">
                      <Image src="/pic/NPC.png" alt="NPC 形象" width={320} height={420} className="page-bg-blend h-full w-full object-contain object-center p-2" />
                    </div>
                  </div>
                </div>

                {episode.status !== "completed" ? (
                  <>
                    <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-medium text-white/85">本回合作答</p>
                      <div className="flex items-start gap-3">
                        <div className="hidden w-24 rounded-[16px] border border-white/10 bg-white/5 xl:block">
                          <Image src="/pic/ME.png" alt="ME 形象" width={180} height={180} className="page-bg-blend h-full w-full object-contain object-center p-2" />
                        </div>
                        <div className="w-full">
                          <Textarea
                            className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                            value={answerInput}
                            onChange={(e) => setAnswerInput(e.target.value)}
                            placeholder="直接输入你的回答。"
                          />
                          <div className="mt-2 flex justify-end">
                            <Button onClick={submitTurn} disabled={progress.active} className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25">
                              提交并推进剧情
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/5 p-3">
                      <p className="text-sm font-medium text-white/85">追问角色（可选）</p>
                      <div className="flex gap-2">
                        <Input
                          className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                          value={talkInput}
                          onChange={(e) => setTalkInput(e.target.value)}
                          placeholder="向角色追问..."
                        />
                        <Button
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white"
                          onClick={askRole}
                          disabled={progress.active}
                        >
                          追问
                        </Button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>

              <div className="space-y-3 rounded-[16px] border border-white/10 bg-white/5 p-3">
                <p className="text-sm font-medium text-white/85">实时能力评分</p>
                {latestTurn ? (
                  latestTurn.aggregate.abilityScores.map((item) => (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-white/55">
                        <span>{item.label}</span>
                        <span>
                          {item.score}/100 · {item.trend}
                        </span>
                      </div>
                      <Progress value={item.score} className="bg-white/10" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-white/55">提交第一回合后显示实时分数。</p>
                )}
              </div>
            </div>
          ) : null}

          {outcome ? (
            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/5 p-3 text-sm">
              <p className="font-medium text-white">他测总分：{outcome.overallScore}</p>
              <p className="text-white/60">{outcome.summary}</p>
            </div>
          ) : null}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">提交到企业端</div>
        <div className="mt-4 space-y-3">
          <p className="text-sm text-white/60">提交后同步：简历原件、AI解析、岗位定制他测结果、客观能力考察摘要。</p>
          <Button onClick={submitBundle} disabled={progress.active} className="bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/20">
            一键打包投递
          </Button>
          {hint ? <p className="text-sm text-white/55">{hint}</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
      </GlassCard>

      <GlassCard className="px-6 py-5">
        <div className="text-[14px] font-semibold text-white">申请流水（{applications.length}）</div>
        <div className="mt-4 rounded-[18px] border border-white/10 bg-white/5 p-2">
          <Table className="text-white/80">
            <TableHeader className="[&_tr]:border-white/10">
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/50">申请编号</TableHead>
                <TableHead className="text-white/50">岗位</TableHead>
                <TableHead className="text-white/50">企业</TableHead>
                <TableHead className="text-white/50">状态</TableHead>
                <TableHead className="text-white/50">简历匹配</TableHead>
                <TableHead className="text-white/50">他测得分</TableHead>
                <TableHead className="text-white/50">日期</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((row) => (
                <TableRow key={`${row.id}-${row.date}`} className="border-white/10 hover:bg-white/5">
                  <TableCell className="text-white/80">{row.id}</TableCell>
                  <TableCell className="text-white/80">{row.job}</TableCell>
                  <TableCell className="text-white/80">{row.company}</TableCell>
                  <TableCell>
                    <Badge className="border border-white/10 bg-white/5 text-white/70">{row.status}</Badge>
                  </TableCell>
                  <TableCell className="text-white/80">{row.resumeFitScore ?? "-"}</TableCell>
                  <TableCell className="text-white/80">{row.assessmentScore ?? "-"}</TableCell>
                  <TableCell className="text-white/80">{row.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </GlassCard>
    </div>
  );
}
