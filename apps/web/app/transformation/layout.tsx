export default function TransformationLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-slate-950">
      {/* Quantum glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute -right-40 top-0 h-[480px] w-[480px] rounded-full bg-fuchsia-500/8 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-[520px] w-[520px] rounded-full bg-blue-500/8 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_25%_15%,rgba(34,211,191,0.07),transparent_55%),radial-gradient(ellipse_at_80%_10%,rgba(168,85,247,0.09),transparent_50%),radial-gradient(ellipse_at_65%_90%,rgba(59,130,246,0.07),transparent_55%)]" />
      </div>

      {/* Nav bar */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-950/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_16px_rgba(34,211,238,0.25)]">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-qdisplay text-xl font-bold text-white">科技成果转化协同平台</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="/transformation/achievements" className="font-quantum text-sm text-white/60 transition-colors hover:text-white">
              成果库
            </a>
            <a href="/transformation/demands" className="font-quantum text-sm text-white/60 transition-colors hover:text-white">
              需求广场
            </a>
            <a href="/student/transformation" className="font-quantum text-sm text-white/60 transition-colors hover:text-white">
              技术人才
            </a>
            <a href="/school/park" className="font-quantum text-sm text-white/60 transition-colors hover:text-white">
              治理平台
            </a>
            <a
              href="/login"
              className="ml-2 rounded-[12px] border border-white/10 bg-white/5 px-4 py-1.5 font-quantum text-sm text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              登录
            </a>
            <a
              href="/register"
              className="rounded-[12px] border border-cyan-300/15 bg-cyan-500/20 px-4 py-1.5 font-quantum text-sm text-cyan-100 shadow-[0_0_12px_rgba(34,211,238,0.12)] transition-all hover:bg-cyan-500/30"
            >
              立即入驻
            </a>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">{children}</div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 bg-slate-950/80 py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex items-center justify-between">
            <p className="font-quantum text-sm text-white/35">
              © 2026 科技成果转化智能协同平台 — 高校 · 企业 · 政府园区
            </p>
            <div className="flex gap-6">
              <a href="/transformation/achievements" className="font-quantum text-xs text-white/35 transition-colors hover:text-white/60">成果库</a>
              <a href="/transformation/demands" className="font-quantum text-xs text-white/35 transition-colors hover:text-white/60">需求广场</a>
              <a href="/student/transformation" className="font-quantum text-xs text-white/35 transition-colors hover:text-white/60">技术人才</a>
              <a href="/school/park" className="font-quantum text-xs text-white/35 transition-colors hover:text-white/60">治理平台</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
