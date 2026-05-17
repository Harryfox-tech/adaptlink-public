"use client";

export function WelcomeCard() {
  return (
    <section className="quantum-glass-texture grid h-[196px] grid-cols-[1fr_220px] rounded-[20px] border border-white/10 bg-slate-950/45 px-7 py-6 shadow-[0_0_40px_rgba(34,211,238,0.08)] backdrop-blur-xl">
      <div>
        <h1 className="font-qdisplay text-[34px] font-extrabold leading-none text-white/90">Hello Grace!</h1>
        <p className="mt-4 max-w-[420px] font-quantum text-[15px] leading-6 text-white/55">
          You have 3 new tasks. It is a lot of work for today! So let&apos;s start!
        </p>
        <button type="button" className="mt-4 font-quantum text-[14px] font-semibold text-cyan-200 underline underline-offset-2">
          review it
        </button>
      </div>
      <div className="relative flex items-center justify-center">
        <div className="h-[150px] w-[150px] rounded-full bg-gradient-to-br from-cyan-500/15 to-violet-500/10 blur-[0.2px]" />
        <div className="absolute -right-1 bottom-5 h-12 w-12 rounded-2xl border border-white/10 bg-cyan-500/25 shadow-[0_0_18px_rgba(34,211,238,0.2)]" />
        <div className="absolute left-3 top-4 h-8 w-8 rounded-xl border border-white/10 bg-white/[0.06] shadow-[0_0_16px_rgba(168,85,247,0.12)]" />
      </div>
    </section>
  );
}
