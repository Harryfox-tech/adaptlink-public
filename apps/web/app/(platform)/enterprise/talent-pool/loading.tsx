import { Progress } from "@/components/ui/progress";

export default function Loading() {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80 backdrop-blur-md">
      <p className="text-sm text-white/60">正在加载 AI 候选人筛选数据...</p>
      <Progress value={72} className="mt-2" />
    </div>
  );
}
