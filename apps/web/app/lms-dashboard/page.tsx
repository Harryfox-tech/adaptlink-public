import * as React from "react";
import { LmsSidebar } from "@/components/lms/sidebar";
import { LmsTopHeader } from "@/components/lms/header";
import { WelcomeCard } from "@/components/lms/welcome-card";
import { PerformanceCard } from "@/components/lms/performance-card";
import { MyVisitCard } from "@/components/lms/my-visit-card";
import { LinkedTeachersCard } from "@/components/lms/linked-teachers-card";
import { CalendarCard } from "@/components/lms/calendar-card";
import { UpcomingEventsCard } from "@/components/lms/upcoming-events-card";

export default function LmsDashboardPage() {
  return (
    <main className="min-h-dvh bg-slate-950 px-8 py-10">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -right-40 -top-32 h-[520px] w-[520px] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute -bottom-48 left-1/3 h-[560px] w-[560px] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(1200px_circle_at_30%_20%,rgba(45,212,191,0.08),transparent_55%),radial-gradient(900px_circle_at_75%_15%,rgba(168,85,247,0.10),transparent_55%),radial-gradient(900px_circle_at_60%_85%,rgba(59,130,246,0.10),transparent_55%)]" />
      </div>
      <div className="relative mx-auto w-[1120px]">
        <div className="mb-8 flex items-center justify-between">
          <div className="font-qdisplay text-[42px] font-semibold text-white">学生成长总览</div>
        </div>

        <div className="flex gap-6">
          <div className="shrink-0">
            <LmsSidebar />
          </div>

          <div className="flex-1">
            <LmsTopHeader />

            <div className="mt-5 grid grid-cols-3 gap-5">
              <div className="col-span-2 space-y-5">
                <WelcomeCard role="student" />
                <div className="grid grid-cols-2 gap-5">
                  <PerformanceCard />
                  <MyVisitCard />
                </div>
                <LinkedTeachersCard />
              </div>

              <div className="col-span-1 space-y-5">
                <CalendarCard />
                <UpcomingEventsCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

