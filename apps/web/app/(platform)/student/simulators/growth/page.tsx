import { StorylineSimulator } from "@/components/simulator/storyline-simulator";

export default function GrowthSimulatorPage() {
  return (
    <StorylineSimulator
      title="成长路径模拟器"
      description="以完整故事线推进校园成长，事件随机触发并实时更新能力状态。"
      tags={["完整剧情", "随机事件", "多Agent评估", "状态机"]}
      simulationType="growth"
      defaultTarget="成为能独立带队的校园项目负责人"
    />
  );
}
