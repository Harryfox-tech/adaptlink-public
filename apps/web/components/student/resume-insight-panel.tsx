"use client";

import { useState } from "react";
import { analyzeStudentResume, extractStudentResumeFromFile } from "@/lib/api/client";
import { ResumeAnalysis, ResumeSnapshot } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { GlassCard } from "@/components/neo/glass-card";

export function ResumeInsightPanel({ snapshot, embedded = false }: { snapshot?: ResumeSnapshot; embedded?: boolean }) {
  const [resumeName, setResumeName] = useState(snapshot?.resumeName ?? "我的简历.pdf");
  const [targetJob, setTargetJob] = useState(snapshot?.targetJob ?? "产品运营专员");
  const [resumeText, setResumeText] = useState("");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("待命");
  const [hint, setHint] = useState<string | null>(null);

  const withProgress = async <T,>(stages: { label: string; ms: number }[], task: () => Promise<T>) => {
    setLoading(true);
    const total = stages.reduce((sum, s) => sum + s.ms, 0);
    const started = Date.now();
    setProgress(8);
    setStage(stages[0]?.label ?? "处理中");
    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      let index = 0;
      let remain = elapsed;
      for (const s of stages) {
        if (remain <= s.ms) break;
        remain -= s.ms;
        index += 1;
      }
      setStage(stages[Math.min(index, stages.length - 1)]?.label ?? "处理中");
      setProgress(Math.round(Math.max(8, Math.min(95, (elapsed / Math.max(700, total)) * 95))));
    }, 120);
    try {
      const result = await task();
      setProgress(100);
      setStage("完成");
      return result;
    } finally {
      clearInterval(timer);
      setLoading(false);
      setTimeout(() => setProgress(0), 900);
    }
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    setResumeName(file.name);
    try {
      const extracted = await withProgress(
        [
          { label: "读取文件", ms: 450 },
          { label: "提取文本", ms: 1000 },
          { label: "回填内容", ms: 500 },
        ],
        () => extractStudentResumeFromFile({ studentId: "stu_001", file }),
      );
      setResumeText(extracted.extractedText);
      setHint(`已提取 ${extracted.charCount} 字（${extracted.fileType.toUpperCase()}）`);
    } catch {
      setHint("提取失败，请更换文件或手动粘贴。");
    }
  };

  const run = async () => {
    if (!resumeText.trim()) return;
    try {
      const result = await withProgress(
        [
          { label: "抽取简历结构", ms: 900 },
          { label: "匹配岗位关键词", ms: 1000 },
          { label: "生成 HR 评审", ms: 1100 },
        ],
        () =>
          analyzeStudentResume({
            studentId: "stu_001",
            resumeName,
            resumeText,
            targetJob,
          }),
      );
      setAnalysis(result);
    } catch {
      setHint("解析失败，请稍后重试。");
    }
  };

  const content = (
    <>
      <div className="text-[14px] font-semibold text-white">简历分析看板</div>
      <div className="mt-4 space-y-3">
        {snapshot ? (
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-3 text-sm">
            <p className="font-medium text-white/90">最近一次分析</p>
            <p className="text-white/60">
              {snapshot.resumeName} · {snapshot.targetJob} · 匹配分 {snapshot.fitScore}
            </p>
            <p className="text-white/60">{snapshot.fitSummary}</p>
          </div>
        ) : null}

        <Input
          className="border border-white/10 bg-white/5 text-white file:text-white/80 placeholder:text-white/35 focus-visible:ring-cyan-300/30"
          type="file"
          accept=".pdf,.docx,.txt"
          onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
        />
        <Input
          className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
          value={resumeName}
          onChange={(e) => setResumeName(e.target.value)}
          placeholder="简历文件名"
        />
        <Input
          className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
          value={targetJob}
          onChange={(e) => setTargetJob(e.target.value)}
          placeholder="目标岗位"
        />
        <Textarea
          className="border border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          placeholder="粘贴简历内容，或先上传文件自动提取。"
        />
        <Button
          onClick={run}
          disabled={loading || !resumeText.trim()}
          className="bg-cyan-500/20 text-cyan-100 hover:bg-cyan-500/25"
        >
          {loading ? "解析中..." : "生成简历分析"}
        </Button>

        {(loading || progress > 0) && (
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-white/55">{stage}</p>
            <Progress value={progress} className="mt-2 bg-white/10" />
          </div>
        )}
        {hint ? <p className="text-xs text-white/55">{hint}</p> : null}

        {analysis ? (
          <div className="rounded-[16px] border border-white/10 bg-white/5 p-3 text-sm">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge className="border border-emerald-300/20 bg-emerald-500/10 text-emerald-200">
                匹配分 {analysis.analysis.fitScore}
              </Badge>
              <Badge className="border border-white/10 bg-white/5 text-white/70">{analysis.targetJob}</Badge>
            </div>
            <p className="text-white/60">{analysis.analysis.fitSummary}</p>
          </div>
        ) : null}
      </div>
    </>
  );

  if (embedded) return <div className="px-1 py-1">{content}</div>;

  return <GlassCard className="px-6 py-5">{content}</GlassCard>;
}
