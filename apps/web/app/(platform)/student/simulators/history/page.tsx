import { getSimulationHistory } from "@/lib/api/client";
import { requireStudentSession } from "@/lib/auth-server";
import { SimulationHistoryTabs } from "@/components/simulator/simulation-history-tabs";
import { Badge } from "@/components/ui/badge";

export default async function StudentSimulationHistoryPage() {
  const { studentId, token } = await requireStudentSession();
  const history = await getSimulationHistory(studentId, token);

  return (
    <div className="space-y-4">
      <section className="mb-6 space-y-3 border-b border-white/10 pb-6">
        <h1 className="text-4xl font-semibold tracking-tight text-white">模拟历史</h1>
        <p className="text-[14px] leading-[22px] text-white/65">查看每次成长/求职模拟记录与 Agent 沉淀的长期记忆。</p>
        <div className="flex flex-wrap gap-2">
          <Badge>会话历史</Badge>
          <Badge>人生记忆墙</Badge>
          <Badge>Agent 轨迹</Badge>
        </div>
      </section>
      <SimulationHistoryTabs history={history} studentId={studentId} />
    </div>
  );
}
