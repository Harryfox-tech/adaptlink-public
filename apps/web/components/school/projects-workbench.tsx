"use client";

import { useState } from "react";
import { generateSchoolProjectQuestions, publishSchoolProject } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ProjectItem = { name: string; need: string; slots: number; status: string };

export function SchoolProjectsWorkbench({ initialProjects }: { initialProjects: ProjectItem[] }) {
  const [name, setName] = useState("企业增长策略实践");
  const [need, setNeed] = useState("业务分析, 数据表达");
  const [slots, setSlots] = useState("8");
  const [status, setStatus] = useState("招募中");
  const [projects, setProjects] = useState<ProjectItem[]>(initialProjects);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const withProgress = async <T,>(task: () => Promise<T>) => {
    setLoading(true);
    setProgress(10);
    const timer = setInterval(() => setProgress((v) => Math.min(95, v + 8)), 120);
    try {
      const result = await task();
      setProgress(100);
      return result;
    } finally {
      clearInterval(timer);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 700);
    }
  };

  const publish = async () => {
    setHint(null);
    const result = await withProgress(() => publishSchoolProject({ name, need, slots: Number(slots), status }));
    if (result.saved) {
      setProjects((prev) => [{ name: result.name, need: result.need, slots: result.slots, status: result.status }, ...prev]);
    }
    setHint(result.saved ? "项目已发布并入库" : "项目发布请求已提交，但数据库不可用");
  };

  const generateQuestions = async () => {
    setHint(null);
    const result = await withProgress(() => generateSchoolProjectQuestions({ name, need }));
    setQuestions(result.questions);
    setHint(`面试问题已生成（${result.engine}）`);
  };

  const push = async () => {
    setHint(null);
    const result = await withProgress(() => publishSchoolProject({ name, need, slots: Number(slots), status: "已推送" }));
    setHint(result.saved ? "精准推送记录已入库" : "推送请求已提交，但数据库不可用");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-3"><Card className="xl:col-span-2"><CardHeader><CardTitle>发布项目岗位</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-2"><div><p className="mb-1 font-quantum text-xs text-white/55">项目名称</p><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div><p className="mb-1 font-quantum text-xs text-white/55">研究/实践方向</p><Input value={need} onChange={(e) => setNeed(e.target.value)} /></div><div><p className="mb-1 font-quantum text-xs text-white/55">名额</p><Input value={slots} onChange={(e) => setSlots(e.target.value)} /></div><div><p className="mb-1 font-quantum text-xs text-white/55">状态</p><Input value={status} onChange={(e) => setStatus(e.target.value)} /></div><div className="md:col-span-2 flex flex-wrap gap-2 pt-1"><Button onClick={() => void publish()} disabled={loading}>发布项目</Button><Button variant="outline" onClick={() => void push()} disabled={loading}>一键精准推送</Button><Button variant="outline" onClick={() => void generateQuestions()} disabled={loading}>生成面试问题</Button></div>{(loading || progress > 0) && <div className="md:col-span-2"><Progress value={progress} /></div>}{hint ? <p className="md:col-span-2 font-quantum text-sm text-white/55">{hint}</p> : null}{questions.length ? <div className="md:col-span-2 space-y-1 rounded-[16px] border border-white/10 bg-white/[0.04] p-3 font-quantum text-sm text-white/60 backdrop-blur-md">{questions.map((q) => <p key={q}>- {q}</p>)}</div> : null}</CardContent></Card><Card><CardHeader><CardTitle>招募流程</CardTitle></CardHeader><CardContent className="space-y-2 font-quantum text-sm text-white/60"><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">发布项目岗位</p><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">智能精准推送</p><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">TAI 初筛 + 导师复核</p><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">录取执行与过程反馈</p></CardContent></Card></div>
      <Card><CardHeader><CardTitle>项目列表</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>项目名称</TableHead><TableHead>能力要求</TableHead><TableHead>名额</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{projects.map((item) => <TableRow key={`${item.name}-${item.status}`}><TableCell className="font-qdisplay font-medium text-white/90">{item.name}</TableCell><TableCell>{item.need}</TableCell><TableCell>{item.slots}</TableCell><TableCell>{item.status}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
