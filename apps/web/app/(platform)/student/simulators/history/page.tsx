import Link from "next/link";
import { getSimulationHistory } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function StudentSimulationHistoryPage() {
  const history = await getSimulationHistory("stu_001");

  return (
    <div className="space-y-4">
      <section className="mb-6 space-y-3 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">模拟历史</h1>
        <p className="text-[14px] leading-[22px] text-white/65">查看每次成长/求职模拟记录，跟踪训练轨迹。</p>
        <div className="flex flex-wrap gap-2">
          <Badge>会话历史</Badge>
          <Badge>能力变化</Badge>
          <Badge>持续迭代</Badge>
        </div>
      </section>
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
    </div>
  );
}
