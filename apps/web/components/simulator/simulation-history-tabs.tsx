"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteLifeMemory, getLifeMemories } from "@/lib/api/client";
import type { LifeMemory, SimulationHistoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function SimulationHistoryTabs({
  history,
  studentId,
}: {
  history: SimulationHistoryItem[];
  studentId: string;
}) {
  const [tab, setTab] = useState<"sessions" | "memories">("sessions");
  const [memories, setMemories] = useState<LifeMemory[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  useEffect(() => {
    if (tab !== "memories") return;
    setLoadingMemories(true);
    getLifeMemories(studentId, 30)
      .then(setMemories)
      .finally(() => setLoadingMemories(false));
  }, [tab, studentId]);

  const removeMemory = async (memoryId: string) => {
    try {
      await deleteLifeMemory(memoryId);
      setMemories((prev) => prev.filter((m) => m.memoryId !== memoryId));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={tab === "sessions" ? "default" : "outline"} size="sm" onClick={() => setTab("sessions")}>
          会话历史
        </Button>
        <Button type="button" variant={tab === "memories" ? "default" : "outline"} size="sm" onClick={() => setTab("memories")}>
          人生记忆墙
        </Button>
      </div>

      {tab === "sessions" ? (
        <Card>
          <CardHeader>
            <CardTitle>历史会话（{history.length}）</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-white/55">暂无历史记录。先完成一次模拟即可在这里查看。</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>场景</TableHead>
                    <TableHead>得分</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>快捷跳转</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.sessionId}>
                      <TableCell>{item.sessionId}</TableCell>
                      <TableCell>
                        <Badge>{item.simulationType}</Badge>
                      </TableCell>
                      <TableCell>{item.scene}</TableCell>
                      <TableCell>{item.overallScore}</TableCell>
                      <TableCell>{item.createdAt}</TableCell>
                      <TableCell>
                        <Link
                          href={item.simulationType === "growth" ? "/student/simulators/growth" : "/student/simulators/job"}
                          className="text-sm font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
                        >
                          前往模拟器
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>人生记忆墙</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMemories ? (
              <p className="text-sm text-white/55">加载中…</p>
            ) : memories.length === 0 ? (
              <p className="text-sm text-white/55">暂无长期记忆。完成 Agent 模拟结局后会自动沉淀。</p>
            ) : (
              <ul className="space-y-3">
                {memories.map((mem) => (
                  <li
                    key={mem.memoryId}
                    className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div>
                      <p className="text-sm text-white/85">{mem.memoryText}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {mem.keywords.map((k) => (
                          <Badge key={k} className="border border-white/20 bg-transparent text-[10px]">
                            {k}
                          </Badge>
                        ))}
                        <span className="text-[10px] text-white/40">重要度 {mem.importance}</span>
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => void removeMemory(mem.memoryId)}>
                      删除
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
