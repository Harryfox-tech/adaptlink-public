import Link from "next/link";
import { JobMatch } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

export function JobRecommendationList({
  jobs,
  showApplyAction = false,
}: {
  jobs: JobMatch[];
  showApplyAction?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>岗位推荐结果</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.map((job) => (
          <div key={job.jobId} className="rounded-[16px] border border-white/10 bg-white/5 p-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <p className="font-medium text-white/85">{job.title}</p>
                <p className="text-xs text-white/55">{job.company}</p>
              </div>
              <p className="text-sm font-semibold text-emerald-300">匹配度 {job.matchScore}%</p>
            </div>
            <Progress value={job.matchScore} />
            <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-white/60">
              {job.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            {showApplyAction ? (
              <div className="mt-3 flex justify-end">
                <Button asChild size="sm">
                  <Link
                    href={`/student/applications?jobId=${encodeURIComponent(job.jobId)}&jobTitle=${encodeURIComponent(job.title)}&company=${encodeURIComponent(job.company)}&match=${encodeURIComponent(String(job.matchScore))}`}
                  >
                    投递简历
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
