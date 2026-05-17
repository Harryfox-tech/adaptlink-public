import type { ResearchAchievement } from "@/lib/types";

const IP_COLORS: Record<string, string> = {
  已授权: "bg-green-500/15 border-green-400/20 text-green-200",
  申请中: "bg-yellow-500/15 border-yellow-400/20 text-yellow-200",
  软件著作权: "bg-blue-500/15 border-blue-400/20 text-blue-200",
  开源: "bg-purple-500/15 border-purple-400/20 text-purple-200",
  无专利: "bg-white/8 border-white/10 text-white/40",
};

interface Props {
  achievement: ResearchAchievement;
}

export function IpBlock({ achievement: a }: Props) {
  const ipColor = IP_COLORS[a.ipStatus] ?? IP_COLORS["无专利"];

  return (
    <div className="space-y-4">
      {/* IP status */}
      <div className="flex items-center gap-3">
        <span className="font-quantum text-sm text-white/50">知识产权状态</span>
        <span className={`rounded-full border px-3 py-1 font-quantum text-sm font-medium ${ipColor}`}>
          {a.ipStatus}
        </span>
        {a.patentType && (
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-quantum text-sm text-white/50">
            {a.patentType}
          </span>
        )}
      </div>

      {/* Patent numbers */}
      {a.patentNumbers.length > 0 && (
        <div>
          <p className="mb-2 font-quantum text-xs text-white/40">专利号</p>
          <div className="space-y-1.5">
            {a.patentNumbers.map((pn) => (
              <div key={pn} className="flex items-center gap-2 rounded-[10px] border border-white/8 bg-white/5 px-3 py-2">
                <svg className="h-3.5 w-3.5 shrink-0 text-cyan-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-quantum text-sm text-white/70">{pn}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Publication link */}
      {a.publicationLink && (
        <div>
          <p className="mb-2 font-quantum text-xs text-white/40">论文/成果链接</p>
          <a
            href={a.publicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-quantum text-sm text-cyan-300/80 hover:text-cyan-300"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            查看原文
          </a>
        </div>
      )}

      {/* No IP note */}
      {a.patentNumbers.length === 0 && !a.publicationLink && (
        <p className="font-quantum text-sm text-white/35">暂无专利号或论文链接信息</p>
      )}
    </div>
  );
}
