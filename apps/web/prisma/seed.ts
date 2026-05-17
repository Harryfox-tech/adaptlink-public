import { PrismaClient, ApplicationStatus, SimulationType, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.application.deleteMany();
  await prisma.jobRecommendation.deleteMany();
  await prisma.abilitySnapshot.deleteMany();
  await prisma.agentReview.deleteMany();
  await prisma.simulationMessage.deleteMany();
  await prisma.simulationSession.deleteMany();
  await prisma.job.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.company.deleteMany();
  await prisma.school.deleteMany();
  await prisma.user.deleteMany();

  const studentUser = await prisma.user.create({
    data: {
      id: "usr_student_001",
      email: "student001@example.com",
      passwordHash: "mock_hash",
      role: UserRole.STUDENT,
      displayName: "张同学",
    },
  });

  const companyOwner = await prisma.user.create({
    data: {
      id: "usr_enterprise_001",
      email: "hr001@example.com",
      passwordHash: "mock_hash",
      role: UserRole.ENTERPRISE,
      displayName: "企业HR",
    },
  });

  const schoolOwner = await prisma.user.create({
    data: {
      id: "usr_school_001",
      email: "teacher001@example.com",
      passwordHash: "mock_hash",
      role: UserRole.SCHOOL,
      displayName: "就业老师",
    },
  });

  const school = await prisma.school.create({
    data: {
      id: "sch_001",
      ownerUserId: schoolOwner.id,
      name: "华东应用大学",
      province: "上海",
      city: "上海",
    },
  });

  const studentProfile = await prisma.studentProfile.create({
    data: {
      id: "stu_profile_001",
      userId: studentUser.id,
      schoolId: school.id,
      major: "信息管理与信息系统",
      grade: "2023级",
      bio: "关注运营增长与项目协作。",
      skills: ["沟通表达", "数据分析", "项目执行"],
    },
  });

  const company = await prisma.company.create({
    data: {
      id: "cmp_001",
      ownerUserId: companyOwner.id,
      name: "星澜科技",
      industry: "互联网",
      size: "200-500人",
      description: "专注增长与智能产品服务。",
    },
  });

  const jobs = await prisma.job.createMany({
    data: [
      {
        id: "job_001",
        companyId: company.id,
        title: "产品运营专员",
        location: "上海",
        description: "负责增长活动与用户运营。",
        requirements: ["沟通表达", "数据分析", "跨团队协作"],
        tags: ["运营", "增长", "校招"],
      },
      {
        id: "job_002",
        companyId: company.id,
        title: "校园市场培训生",
        location: "杭州",
        description: "负责校园市场拓展与活动执行。",
        requirements: ["活动策划", "执行推进", "团队协作"],
        tags: ["市场", "校招", "培训生"],
      },
    ],
  });

  const session = await prisma.simulationSession.create({
    data: {
      id: "sim_session_001",
      userId: studentUser.id,
      studentProfileId: studentProfile.id,
      simulationType: SimulationType.JOB,
      scene: "产品运营岗位压力面试",
      targetJob: "产品运营专员",
      status: "completed",
      overallScore: 79,
      aggregateSummary: "岗位理解较好，建议加强高压场景结构化表达。",
    },
  });

  await prisma.simulationMessage.createMany({
    data: [
      { sessionId: session.id, role: "assistant", content: "请介绍你如何拆解北极星指标。" },
      { sessionId: session.id, role: "user", content: "我会先确认目标行为，再拆留存和转化。" },
    ],
  });

  await prisma.agentReview.createMany({
    data: [
      { sessionId: session.id, agentName: "HR 面试官 Agent", score: 80, summary: "表达自然，动机明确。", highlights: ["表达完整", "职业动机清晰"] },
      { sessionId: session.id, agentName: "业务面试官 Agent", score: 77, summary: "分析框架较清晰，案例深度不足。", highlights: ["框架清楚", "业务理解到位"] },
    ],
  });

  await prisma.abilitySnapshot.createMany({
    data: [
      { userId: studentUser.id, sourceSessionId: session.id, abilityKey: "communication", abilityLabel: "沟通表达能力", score: 78, trend: "up" },
      { userId: studentUser.id, sourceSessionId: session.id, abilityKey: "logic", abilityLabel: "逻辑分析能力", score: 75, trend: "flat" },
      { userId: studentUser.id, sourceSessionId: session.id, abilityKey: "fit", abilityLabel: "岗位匹配度", score: 79, trend: "up" },
    ],
  });

  await prisma.jobRecommendation.createMany({
    data: [
      {
        id: "rec_001",
        studentProfileId: studentProfile.id,
        jobId: "job_001",
        sourceSessionId: session.id,
        matchScore: 86,
        reasons: ["沟通协作能力匹配", "执行力稳定"],
      },
      {
        id: "rec_002",
        studentProfileId: studentProfile.id,
        jobId: "job_002",
        sourceSessionId: session.id,
        matchScore: 81,
        reasons: ["活动推进能力较好", "抗压表现中上"],
      },
    ],
  });

  await prisma.application.create({
    data: {
      id: "app_001",
      userId: studentUser.id,
      jobId: "job_001",
      status: ApplicationStatus.INTERVIEWING,
      notes: "已完成一轮面试，等待复试安排。",
    },
  });

  console.log(`Seed completed. Jobs inserted: ${jobs.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
