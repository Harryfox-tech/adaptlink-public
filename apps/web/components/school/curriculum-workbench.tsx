"use client";

import { useState } from "react";
import { optimizeSchoolCurriculum } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

type ProgressMeta = {
  active: boolean;
  value: number;
  stage: string;
};

type MapRow = { course: string; ability: string; contribution: string; market: string };

export function SchoolCurriculumWorkbench({
  initialData,
}: {
  initialData: {
    map_rows: MapRow[];
    optimize_suggestions: string[];
  };
}) {
  const [major, setMajor] = useState("信息管理与信息系统");
  const [objective, setObjective] = useState("提升学生岗位匹配与实践表达能力");
  const [contextNote, setContextNote] = useState("");
  const [rows, setRows] = useState<MapRow[]>(initialData.map_rows);
  const [suggestions, setSuggestions] = useState<string[]>(initialData.optimize_suggestions);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<ProgressMeta>({ active: false, value: 0, stage: "待命" });
  const [engine, setEngine] = useState<string | null>(null);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const withProgress = async <T,>(stages: { label: string; ms: number }[], task: () => Promise<T>) => {
    setHint(null);
    setError(null);
    setLoading(true);
    const total = stages.reduce((sum, item) => sum + item.ms, 0);
    const started = Date.now();
    setProgress({ active: true, value: 8, stage: stages[0]?.label ?? "处理中" });

    const timer = setInterval(() => {
      const elapsed = Date.now() - started;
      const ratio = Math.min(0.95, elapsed / Math.max(700, total));
      let remain = elapsed;
      let index = 0;
      for (const stage of stages) {
        if (remain <= stage.ms) break;
        remain -= stage.ms;
        index += 1;
      }
      setProgress({
        active: true,
        value: Math.round(Math.max(8, ratio * 95)),
        stage: stages[Math.min(index, stages.length - 1)]?.label ?? "处理中",
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

  const handleOptimize = async () => {
    try {
      const result = await withProgress(
        [
          { label: "整理课程映射输入", ms: 700 },
          { label: "AI 生成优化方案", ms: 1300 },
          { label: "写入数据库并返回", ms: 800 },
        ],
        () =>
          optimizeSchoolCurriculum({
            major,
            objective,
            contextNote,
            currentRows: rows,
          }),
      );
      setRows(result.mapRows);
      setSuggestions(result.optimizeSuggestions);
      setEngine(result.engine);
      setSaved(result.saved);
      setHint(result.saved ? "课程优化方案已生成并落库" : "课程优化已生成，但当前数据库不可用");
    } catch (e) {
      setError(e instanceof Error ? e.message : "生成失败");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>课程优化生成器</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(loading || progress.active) && (
            <div className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">
              <p className="font-quantum text-xs text-white/55">{progress.stage}</p>
              <Progress value={progress.value} className="mt-2" />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">专业</p>
              <Input value={major} onChange={(e) => setMajor(e.target.value)} />
            </div>
            <div>
              <p className="mb-1 font-quantum text-xs text-white/55">培养目标</p>
              <Input value={objective} onChange={(e) => setObjective(e.target.value)} />
            </div>
          </div>
          <div>
            <p className="mb-1 font-quantum text-xs text-white/55">补充说明</p>
            <Textarea rows={3} value={contextNote} onChange={(e) => setContextNote(e.target.value)} placeholder="可输入企业反馈、学期目标或新增要求" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={handleOptimize} disabled={loading}>AI 生成课程优化</Button>
            {engine ? <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">引擎: {engine}</Badge> : null}
            {saved !== null ? <Badge className="border border-white/10 bg-white/5 font-quantum text-white/70">数据库: {saved ? "已落库" : "不可用"}</Badge> : null}
          </div>
          {hint ? <p className="font-quantum text-sm text-white/55">{hint}</p> : null}
          {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>课程能力映射明细</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>课程</TableHead>
                <TableHead>对应能力项</TableHead>
                <TableHead>贡献度</TableHead>
                <TableHead>市场匹配</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.course}-${row.ability}`}>
                  <TableCell className="font-qdisplay font-medium text-white/90">{row.course}</TableCell>
                  <TableCell>{row.ability}</TableCell>
                  <TableCell>{row.contribution}</TableCell>
                  <TableCell>{row.market}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI 课程优化建议</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 font-quantum text-sm text-white/60 md:grid-cols-2">
          {suggestions.map((item) => (
            <p key={item} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">{item}</p>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

