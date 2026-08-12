import { PlatformRole } from "@/lib/types";

export type PlatformNavItem = { label: string; href: string; shortLabel?: string };

export const platformNavMap: Record<PlatformRole, PlatformNavItem[]> = {
  student: [
    { label: "学生首页", href: "/student/dashboard", shortLabel: "首页" },
    { label: "成长档案", href: "/student/profile", shortLabel: "档案" },
    { label: "成长模拟", href: "/student/simulators/growth", shortLabel: "成长" },
    { label: "求职模拟", href: "/student/simulators/job", shortLabel: "求职" },
    { label: "模拟历史", href: "/student/simulators/history", shortLabel: "历史" },
    { label: "岗位推荐", href: "/student/recommendations", shortLabel: "推荐" },
    { label: "投递中心", href: "/student/applications", shortLabel: "投递" },
    { label: "AI 助手", href: "/student/assistant", shortLabel: "助手" },
  ],
  enterprise: [
    { label: "招聘总览", href: "/enterprise/dashboard", shortLabel: "总览" },
    { label: "岗位建模中心", href: "/enterprise/jobs", shortLabel: "岗位" },
    { label: "候选人工作台", href: "/enterprise/talent-pool", shortLabel: "候选人" },
    { label: "投递收件箱", href: "/enterprise/applications", shortLabel: "收件箱" },
    { label: "流程协同", href: "/enterprise/recruitment", shortLabel: "流程" },
    { label: "校企协同", href: "/enterprise/partnerships", shortLabel: "协同" },
    { label: "数据洞察", href: "/enterprise/analytics", shortLabel: "洞察" },
    { label: "权限与治理", href: "/enterprise/settings", shortLabel: "权限" },
  ],
  school: [
    { label: "培养诊断总览", href: "/school/dashboard", shortLabel: "总览" },
    { label: "学生画像管理", href: "/school/students", shortLabel: "画像" },
    { label: "专业与课程分析", href: "/school/curriculum", shortLabel: "课程" },
    { label: "项目招募中心", href: "/school/projects", shortLabel: "项目" },
    { label: "就业去向分析", href: "/school/employment", shortLabel: "就业" },
    { label: "干预任务中心", href: "/school/interventions", shortLabel: "干预" },
    { label: "校企协同管理", href: "/school/partnerships", shortLabel: "协同" },
    { label: "决策报告中心", href: "/school/analytics", shortLabel: "报告" },
    { label: "权限与治理", href: "/school/settings", shortLabel: "权限" },
  ],
};

export const platformRoleName: Record<PlatformRole, string> = {
  student: "学生端",
  enterprise: "企业端",
  school: "高校端",
};
