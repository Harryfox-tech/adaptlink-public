"use client";

import { useMemo, useState } from "react";
import { generateEnterpriseJobModel, saveEnterpriseJobModel } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

type ProgressMeta = {
  active: boolean;
  value: number;
  stage: string;
};

export function EnterpriseJobsCenterWorkbench({
  initialData,
}: {
  initialData: {
    templates: { name: string; dept: string; use_count: string }[];
    default_weights: Record<string, number>;
    default_required_skills: string[];
  };
}) {
  const [jobName, setJobName] = useState("数据产品实习生");
  const [department, setDepartment] = useState("数据中台");
  const [level, setLevel] = useState("实习生");
  const [workMode, setWorkMode] = useState("混合");
  const [requiredSkillsText, setRequiredSkillsText] = useState(initialData.default_required_skills.join(", "));
  const [weightsText, setWeightsText] = useState(JSON.stringify(initialData.default_weights));
  const [description, setDescription] = useState("");

  const [summary, setSummary] = useState("");
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [engine, setEngine] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressMeta>({ active: false, value: 0, stage: "待命" });
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const withProgress = async <T,>(stages: { label: string; ms: number }[], task: () => Promise<T>) => {
    setError(null);
    setHint(null);
    setLoading(true);
    const total = stages.reduce((sum, item) => sum + item.ms, 0);
    const started = Date.now();
    setProgress({ active: true, value: 8, stage: stages[0]?.label ?? "处理中" });

    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const ratio = Math.min(0.95, elapsed / Math.max(700, total));
      let remain = elapsed;
      let idx = 0;
      for (const stage of stages) {
        if (remain <= stage.ms) break;
        remain -= stage.ms;
        idx += 1;
      }
      setProgress({
        active: true,
        value: Math.round(Math.max(8, ratio * 95)),
        stage: stages[Math.min(idx, stages.length - 1)]?.label ?? "处理中",
      });
    }, 120);

    try {
      const result = await task();
      setProgress({ active: true, value: 100, stage: "完成" });
      return result;
    } finally {
      clearInterval(timer);
      setLoading(false);
      setTimeout(() => setProgress({ active: false, value: 0, stage: "待命" }), 900);
    }
  };

  const parsedRequiredSkills = useMemo(
    () => requiredSkillsText.split(",").map((item) => item.trim()).filter(Boolean),
    [requiredSkillsText],
  );

  const parseWeights = () => {
    try {
      const parsed = JSON.parse(weightsText) as Record<string, number>;
      const normalized: Record<string, number> = {};
      Object.entries(parsed).forEach(([key, value]) => {
        if (key.trim()) normalized[key.trim()] = Number(value);
      });
      return normalized;
    } catch {
      throw new Error("能力权重 JSON 解析失败，请检查格式");
    }
  };

  const handleGenerate = async () => {
    if (!description.trim()) {
      setHint("请先输入岗位描述，再执行 AI 生成模型");
      return;
    }

    try {
      const result = await withProgress(
        [
          { label: "准备岗位输入", ms: 600 },
          { label: "AI 生成能力模型", ms: 1300 },
          { label: "写入数据库并返回", ms: 800 },
        ],
        () =>
          generateEnterpriseJobModel(null, {
            jobName,
            department,
            level,
            workMode,
            requiredSkills: parsedRequiredSkills,
            weightHints: parseWeights(),
            description,
          }),
      );
      setWeightsText(JSON.stringify(result.weights));
      setRequiredSkillsText(result.requiredSkills.join(", "));
      setSummary(result.summary);
      setInterviewQuestions(result.interviewQuestions);
      setEngine(result.engine);
      setSaved(result.saved);
      setHint(result.saved ? "AI 模型已生成并写入数据库" : "AI 模型已生成，但当前数据库不可用");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    }
  };

  const handleSave = async () => {
    try {
      const result = await withProgress(
        [
          { label: "校验岗位字段", ms: 500 },
          { label: "保存岗位模型", ms: 1000 },
        ],
        () =>
          saveEnterpriseJobModel(null, {
            jobName,
            department,
            level,
            workMode,
            requiredSkills: parsedRequiredSkills,
            weights: parseWeights(),
            summary,
            interviewQuestions,
          }),
      );
      setEngine(result.engine);
      setSaved(result.saved);
      setHint(result.saved ? "岗位模型已保存到数据库" : "已调用保存接口，但数据库不可用");
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存失败");
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>新建岗位模型</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(loading || progress.active) && (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <p className="font-quantum text-xs text-white/55">{progress.stage}</p>
              <Progress value={progress.value} className="mt-2" />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">岗位名称</p>
              <Input value={jobName} onChange={(e) => setJobName(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">所属部门</p>
              <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">职级</p>
              <Input value={level} onChange={(e) => setLevel(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">工作方式</p>
              <Input value={workMode} onChange={(e) => setWorkMode(e.target.value)} />
            </div>
          </div>

          <div>
            <p className="mb-1 font-quantum text-xs text-white/55">必备能力（逗号分隔）</p>
            <Input value={requiredSkillsText} onChange={(e) => setRequiredSkillsText(e.target.value)} />
          </div>

          <div>
            <p className="mb-1 font-quantum text-xs text-white/55">能力权重配置（JSON）</p>
            <Textarea rows={4} value={weightsText} onChange={(e) => setWeightsText(e.target.value)} />
          </div>

          <div>
            <p className="mb-1 font-quantum text-xs text-white/55">岗位描述（用于 AI 自动建模）</p>
            <Textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="输入岗位职责、目标、场景与候选人画像" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={handleSave} disabled={loading}>保存岗位模型</Button>
            <Button variant="outline" onClick={handleGenerate} disabled={loading}>AI 生成模型</Button>
            <Button variant="outline" disabled>与历史版本对比</Button>
          </div>

          {summary ? (
            <div className="space-y-2 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 text-sm backdrop-blur-md">
              <div className="flex flex-wrap gap-2">
                {engine ? <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">引擎: {engine}</Badge> : null}
                {saved !== null ? <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">数据库: {saved ? "已落库" : "不可用"}</Badge> : null}
              </div>
              <p className="font-quantum text-white/60">{summary}</p>
              {interviewQuestions.map((item) => (
                <p key={item} className="font-quantum text-white/60">- {item}</p>
              ))}
            </div>
          ) : null}

          {hint ? <p className="font-quantum text-sm text-white/55">{hint}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>模板库</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {initialData.templates.map((item) => (
            <div key={item.name} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <p className="font-qdisplay font-medium text-white/90">{item.name}</p>
              <p className="mt-1 font-quantum text-white/60">{item.dept}</p>
              <p className="mt-1 font-quantum text-xs text-white/45">复用次数：{item.use_count}</p>
            </div>
          ))}
          <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">支持同岗位跨批次能力变化对比</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

