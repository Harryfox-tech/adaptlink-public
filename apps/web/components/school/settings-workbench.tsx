"use client";

import { useState } from "react";
import { saveSchoolSettingsData } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";

export function SchoolSettingsWorkbench({
  initialData,
}: {
  initialData: {
    role_rows: { role: string; perms: string; scope: string }[];
    governance_rows: { item: string; rule: string }[];
  };
}) {
  const [roleText, setRoleText] = useState(JSON.stringify(initialData.role_rows, null, 2));
  const [ruleText, setRuleText] = useState(JSON.stringify(initialData.governance_rows, null, 2));
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState<string | null>(null);

  const save = async () => {
    setHint(null);
    setLoading(true);
    setProgress(10);
    const timer = setInterval(() => setProgress((v) => Math.min(93, v + 9)), 120);
    try {
      const roleRows = JSON.parse(roleText);
      const governanceRows = JSON.parse(ruleText);
      const result = await saveSchoolSettingsData({ roleRows, governanceRows });
      setProgress(100);
      setHint(result.saved ? "高校设置已保存到数据库" : "保存请求已提交，但数据库不可用");
    } catch {
      setHint("JSON 格式错误，请检查后重试");
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
      <Card><CardHeader><CardTitle>角色权限矩阵</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>角色</TableHead><TableHead>核心权限</TableHead><TableHead>作用范围</TableHead></TableRow></TableHeader><TableBody>{initialData.role_rows.map((row) => <TableRow key={row.role}><TableCell className="font-qdisplay font-medium text-white/90">{row.role}</TableCell><TableCell>{row.perms}</TableCell><TableCell>{row.scope}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <Card><CardHeader><CardTitle>治理规则</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>治理项</TableHead><TableHead>规则</TableHead></TableRow></TableHeader><TableBody>{initialData.governance_rows.map((row) => <TableRow key={row.item}><TableCell className="font-qdisplay font-medium text-white/90">{row.item}</TableCell><TableCell>{row.rule}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      <Card>
        <CardHeader><CardTitle>编辑并保存配置</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="font-quantum text-xs text-white/55">角色矩阵 JSON</p>
          <Textarea rows={8} value={roleText} onChange={(e) => setRoleText(e.target.value)} />
          <p className="font-quantum text-xs text-white/55">治理规则 JSON</p>
          <Textarea rows={8} value={ruleText} onChange={(e) => setRuleText(e.target.value)} />
          {(loading || progress > 0) && <Progress value={progress} />}
          <Button onClick={save} disabled={loading}>{loading ? "保存中..." : "保存设置"}</Button>
          {hint ? <p className="font-quantum text-sm text-white/55">{hint}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
