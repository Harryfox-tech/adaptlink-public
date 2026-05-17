"use client";

import { useState } from "react";
import { submitEnterpriseRecruitmentFeedback } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export function EnterpriseRecruitmentWorkbench({
  initialData,
}: {
  initialData: {
    flow: { stage: string; count: number; owner: string; sla: string }[];
    templates: { stage: string; ability: string; question: string }[];
  };
}) {
  const [candidateId, setCandidateId] = useState("");
  const [jobId, setJobId] = useState("");
  const [businessScore, setBusinessScore] = useState("80");
  const [communicationScore, setCommunicationScore] = useState("80");
  const [problemScore, setProblemScore] = useState("80");
  const [conclusion, setConclusion] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const submit = async (draft: boolean) => {
    setLoading(true);
    setHint(null);
    setProgress(10);
    const timer = setInterval(() => setProgress((v) => Math.min(94, v + 9)), 120);
    try {
      const result = await submitEnterpriseRecruitmentFeedback(null, {
        candidateId,
        jobId,
        businessScore: Number(businessScore),
        communicationScore: Number(communicationScore),
        problemSolvingScore: Number(problemScore),
        conclusion,
        draft,
      });
      setHint(result.saved ? `${draft ? "草稿" : "回流评分"}已入库` : `${draft ? "草稿" : "回流评分"}已提交但数据库不可用`);
      setProgress(100);
    } finally {
      clearInterval(timer);
      setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 700);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>流程状态</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>流程阶段</TableHead><TableHead>人数</TableHead><TableHead>负责人</TableHead><TableHead>时效要求</TableHead></TableRow></TableHeader>
            <TableBody>{initialData.flow.map((row) => <TableRow key={row.stage}><TableCell className="font-qdisplay font-medium text-white/90">{row.stage}</TableCell><TableCell>{row.count}</TableCell><TableCell>{row.owner}</TableCell><TableCell>{row.sla}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>结构化面试题模板</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>阶段</TableHead><TableHead>对应能力</TableHead><TableHead>示例问题</TableHead></TableRow></TableHeader>
              <TableBody>{initialData.templates.map((item) => <TableRow key={item.stage}><TableCell>{item.stage}</TableCell><TableCell>{item.ability}</TableCell><TableCell>{item.question}</TableCell></TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>面试评分回流表单</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="候选人 ID" value={candidateId} onChange={(e) => setCandidateId(e.target.value)} />
            <Input placeholder="岗位 ID" value={jobId} onChange={(e) => setJobId(e.target.value)} />
            <Input placeholder="业务理解得分（0-100）" value={businessScore} onChange={(e) => setBusinessScore(e.target.value)} />
            <Input placeholder="协作沟通得分（0-100）" value={communicationScore} onChange={(e) => setCommunicationScore(e.target.value)} />
            <Input placeholder="问题拆解得分（0-100）" value={problemScore} onChange={(e) => setProblemScore(e.target.value)} />
            <Textarea rows={4} placeholder="面试结论与追问记录（将回流岗位模型）" value={conclusion} onChange={(e) => setConclusion(e.target.value)} />
            {(loading || progress > 0) && <Progress value={progress} />}
            <div className="flex gap-2"><Button onClick={() => void submit(false)} disabled={loading}>提交回流评分</Button><Button variant="outline" onClick={() => void submit(true)} disabled={loading}>保存草稿</Button></div>
            {hint ? <p className="font-quantum text-sm text-white/55">{hint}</p> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
