"use client";

import { useState } from "react";
import { filterEnterpriseAnalytics } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EnterpriseAnalyticsWorkbench({
  initialData,
}: {
  initialData: {
    channel_rows: { channel: string; conversion: number; quality: string; schools: string; note: string }[];
    heat_rows: { school: string; applicants: number; fit: string; gap: string }[];
    gap_trend: Record<string, number>;
  };
}) {
  const [jobFamily, setJobFamily] = useState("");
  const [school, setSchool] = useState("");
  const [abilityGap, setAbilityGap] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const query = async () => {
    setLoading(true);
    setProgress(10);
    const timer = setInterval(() => setProgress((v) => Math.min(92, v + 8)), 120);
    try {
      const next = await filterEnterpriseAnalytics(null, { jobFamily, school, abilityGap, timeRange });
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
      <Card>
        <CardHeader><CardTitle>联动筛选器</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <Input placeholder="岗位族" value={jobFamily} onChange={(e) => setJobFamily(e.target.value)} />
            <Input placeholder="院校" value={school} onChange={(e) => setSchool(e.target.value)} />
            <Input placeholder="能力缺口" value={abilityGap} onChange={(e) => setAbilityGap(e.target.value)} />
            <Input placeholder="时间范围" value={timeRange} onChange={(e) => setTimeRange(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button onClick={query} disabled={loading}>{loading ? "筛选中..." : "执行筛选"}</Button>
          </div>
          {(loading || progress > 0) && <Progress value={progress} />}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>能力缺口趋势（近30天）</CardTitle></CardHeader>
          <CardContent className="space-y-3 font-quantum text-sm text-white/60">
            {Object.entries(data.gap_trend).map(([k, v]) => (
              <div key={k}>
                <div className="mb-1 flex items-center justify-between"><span>{k}</span><span className="tabular-nums text-white/75">{v}</span></div>
                <div className="h-2 rounded-full bg-white/[0.08]">
                  <div className="h-2 rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500" style={{ width: `${v}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>院校来源热力概览</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>院校</TableHead><TableHead>候选人数</TableHead><TableHead>平均适配度</TableHead><TableHead>主要缺口</TableHead></TableRow></TableHeader>
              <TableBody>{data.heat_rows.map((row) => <TableRow key={row.school}><TableCell className="font-qdisplay font-medium text-white/90">{row.school}</TableCell><TableCell>{row.applicants}</TableCell><TableCell>{row.fit}</TableCell><TableCell>{row.gap}</TableCell></TableRow>)}</TableBody></Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>渠道质量对比</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>渠道</TableHead><TableHead>转化率</TableHead><TableHead>质量评级</TableHead><TableHead>来源院校特征</TableHead><TableHead>运营建议</TableHead></TableRow></TableHeader>
            <TableBody>{data.channel_rows.map((row) => <TableRow key={row.channel}><TableCell className="font-qdisplay font-medium text-white/90">{row.channel}</TableCell><TableCell>{row.conversion}%</TableCell><TableCell>{row.quality}</TableCell><TableCell>{row.schools}</TableCell><TableCell>{row.note}</TableCell></TableRow>)}</TableBody></Table>
        </CardContent>
      </Card>
    </div>
  );
}
