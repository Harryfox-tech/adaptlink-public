import { StorylineSimulator } from "@/components/simulator/storyline-simulator";

export default function JobSimulatorPage() {
  return (
    <StorylineSimulator
      title="求职能力模拟器"
      description="围绕目标岗位生成完整面试剧情线，包含机会、冲突与压力事件。"
      tags={["完整故事线", "随机面试事件", "多Agent评估", "岗位结局"]}
      simulationType="job"
      defaultTarget="产品运营专员"
    />
  );
}
