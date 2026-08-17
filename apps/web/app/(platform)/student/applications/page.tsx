import { getStudentApplications } from "@/lib/api/client";
import { requireStudentSession } from "@/lib/auth-server";
import { Badge } from "@/components/ui/badge";
import { ApplicationStudio } from "@/components/student/application-studio";
import { NeoCanvas } from "@/components/neo/neo-canvas";

export default async function StudentApplicationsPage({
  searchParams,
}: {
  searchParams?: Promise<{
    jobId?: string;
    jobTitle?: string;
    company?: string;
    match?: string;
  }>;
}) {
  const { studentId, token } = await requireStudentSession();
  const applications = await getStudentApplications(studentId, token);
  const resolved = (await searchParams) ?? {};

  const selectedJob = resolved.jobId
    ? {
        jobId: resolved.jobId,
        jobTitle: resolved.jobTitle ?? "",
        company: resolved.company ?? "",
        matchScore: resolved.match ? Number(resolved.match) : undefined,
      }
    : undefined;

  return (
    <NeoCanvas>
      <div className="space-y-4">
        <section className="mb-6 space-y-3 border-b border-white/10 pb-6">
          <h1 className="text-4xl font-semibold tracking-tight text-white">简历投递与岗位他测</h1>
          <p className="text-[14px] leading-[22px] text-white/65">
            上传简历并生成 AI 解析，完成岗位定制他测后，将完整投递包同步到企业端。
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="border border-white/10 bg-white/5 text-white/80">简历解析</Badge>
            <Badge className="border border-white/10 bg-white/5 text-white/80">岗位他测</Badge>
            <Badge className="border border-white/10 bg-white/5 text-white/80">企业投递包</Badge>
          </div>
        </section>
        <ApplicationStudio initialItems={applications} selectedJob={selectedJob} />
      </div>
    </NeoCanvas>
  );
}
