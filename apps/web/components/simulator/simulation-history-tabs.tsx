"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { deleteLifeMemory, getLifeMemories } from "@/lib/api/client";
import type { LifeMemory, SimulationHistoryItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { labelSimulationType } from "@/lib/ui-labels";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, Sparkles } from "lucide-react";

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
              <EmptyState
                icon={<History className="h-5 w-5" />}
                title="还没有模拟记录"
                description="完成一次成长或求职模拟后，会话、得分与复盘链接会出现在这里。"
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button asChild size="sm">
                      <Link href="/student/simulators/growth">开始成长模拟</Link>
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link href="/student/simulators/job">开始求职模拟</Link>
                    </Button>
                  </div>
                }
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>会话 ID</TableHead>
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
                        <Badge>{labelSimulationType(item.simulationType)}</Badge>
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
              <TableSkeleton rows={3} cols={1} />
            ) : memories.length === 0 ? (
              <EmptyState
                icon={<Sparkles className="h-5 w-5" />}
                title="人生记忆墙还是空的"
                description="完成带 Agent 结局的模拟后，系统会把关键经历沉淀为长期记忆，供后续模拟引用。"
              />
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
