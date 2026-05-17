"use client";

import { useState } from "react";
import { exportSchoolAnalytics } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SchoolAnalyticsWorkbench({
  initialRows,
}: {
  initialRows: { type: string; focus: string; output: string }[];
}) {
  const [timeRange, setTimeRange] = useState("2026Q1");
  const [school, setSchool] = useState("信息学院");
  const [major, setMajor] = useState("信息管理");
  const [version, setVersion] = useState("院级改革版");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const runExport = async (exportType: string) => {
    setLoading(true);
    setHint(null);
    setProgress(8);
    const timer = setInterval(() => setProgress((v) => Math.min(95, v + 9)), 120);
    try {
      const result = await exportSchoolAnalytics({ timeRange, school, major, version, exportType });
      setHint(result.saved ? `${result.export_type} 导出任务已入库` : `${result.export_type} 导出任务已提交但数据库不可用`);
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
      <Card><CardHeader><CardTitle>报告参数</CardTitle></CardHeader><CardContent className="grid gap-3 md:grid-cols-4"><Input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} placeholder="时间范围：2026Q1" /><Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="学院：信息学院" /><Input value={major} onChange={(e) => setMajor(e.target.value)} placeholder="专业：信息管理" /><Input value={version} onChange={(e) => setVersion(e.target.value)} placeholder="版本：院级改革版" /></CardContent></Card>
      <Card><CardHeader><CardTitle>报告模板库</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>模板类型</TableHead><TableHead>核心关注</TableHead><TableHead>输出对象</TableHead></TableRow></TableHeader><TableBody>{initialRows.map((row) => <TableRow key={row.type}><TableCell className="font-qdisplay font-medium text-white/90">{row.type}</TableCell><TableCell>{row.focus}</TableCell><TableCell>{row.output}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <Card><CardHeader><CardTitle>导出与分发</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-2 md:grid-cols-3"><Button onClick={() => void runExport("PDF")}>导出 PDF 报告</Button><Button variant="outline" onClick={() => void runExport("PNG")}>导出图表包（PNG）</Button><Button variant="outline" onClick={() => void runExport("CSV")}>导出数据表（CSV）</Button></div>{(loading || progress > 0) && <Progress value={progress} />}{hint ? <p className="font-quantum text-sm text-white/55">{hint}</p> : null}</CardContent></Card>
    </div>
  );
}
