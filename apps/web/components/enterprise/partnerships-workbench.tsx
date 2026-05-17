"use client";

import { useState } from "react";
import { queryEnterprisePartnerships } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EnterprisePartnershipsWorkbench({
  initialData,
}: {
  initialData: {
    schools: { school: string; active: number; fit: string; contact: string; score: string }[];
    activities: { date: string; item: string; owner: string; status: string }[];
  };
}) {
  const [query, setQuery] = useState("");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const runQuery = async () => {
    setLoading(true);
    setProgress(12);
    const timer = setInterval(() => setProgress((v) => Math.min(92, v + 10)), 120);
    try {
      const next = await queryEnterprisePartnerships(null, query);
      setData(next);
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
      <Card><CardHeader><CardTitle>对话式检索</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-[1fr_auto]"><Input placeholder="过去90天哪些院校在数据产品岗位转化最高？" value={query} onChange={(e) => setQuery(e.target.value)} /><Button onClick={runQuery} disabled={loading}>{loading ? "查询中..." : "查询"}</Button></div>{(loading || progress > 0) && <Progress value={progress} />}</CardContent></Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2"><CardHeader><CardTitle>合作院校与联系人</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>院校</TableHead><TableHead>活跃候选人</TableHead><TableHead>岗位适配</TableHead><TableHead>联系人</TableHead><TableHead>协同评分</TableHead></TableRow></TableHeader><TableBody>{data.schools.map((row) => <TableRow key={row.school}><TableCell className="font-qdisplay font-medium text-white/90">{row.school}</TableCell><TableCell>{row.active}</TableCell><TableCell>{row.fit}</TableCell><TableCell>{row.contact}</TableCell><TableCell>{row.score}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>本周协同动作</CardTitle></CardHeader><CardContent className="space-y-2 font-quantum text-sm text-white/60"><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">发布 2 个定向校招岗位</p><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">更新院校联系人分工</p><p className="rounded-[16px] border border-white/10 bg-white/[0.04] p-3 backdrop-blur-md">对低转化院校发起联合课程合作</p><Badge className="border border-orange-500/20 bg-orange-500/10 font-quantum text-orange-100/80">协同评分低于 B 自动预警</Badge></CardContent></Card>
      </div>

      <Card><CardHeader><CardTitle>活动排期</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>日期</TableHead><TableHead>活动</TableHead><TableHead>负责人</TableHead><TableHead>状态</TableHead></TableRow></TableHeader><TableBody>{data.activities.map((item) => <TableRow key={`${item.date}-${item.item}`}><TableCell>{item.date}</TableCell><TableCell>{item.item}</TableCell><TableCell>{item.owner}</TableCell><TableCell>{item.status}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
