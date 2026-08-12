"use client";

import * as React from "react";
import Link from "next/link";
import { FaEllipsisV } from "react-icons/fa";

export type UpcomingEvent = {
  title: string;
  meta: string;
  href?: string;
};

const defaultEvents: UpcomingEvent[] = [
  {
    title: "完成今日简历解析与岗位匹配",
    meta: "建议优先处理",
  },
  {
    title: "查看模拟训练反馈与复盘",
    meta: "成长 / 求职模拟",
  },
];

export function UpcomingEventsCard({
  title = "重点提醒",
  actionLabel = "查看全部",
  actionHref = "#",
  events = defaultEvents,
}: {
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  events?: UpcomingEvent[];
}) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
      <div className="flex items-center justify-between">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        <Link href={actionHref} className="text-[12px] font-semibold text-cyan-300 hover:text-cyan-200">
          {actionLabel}
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {events.map((ev) => (
          <div
            key={`${ev.title}-${ev.meta}`}
            className="flex items-start justify-between gap-3 rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 transition hover:-translate-y-[1px] hover:bg-white/7 hover:shadow-[0_0_18px_rgba(34,211,238,0.10)]"
          >
            <div className="flex items-start gap-3">
              <div className="mt-1 h-9 w-9 rounded-full bg-cyan-500/12 ring-1 ring-cyan-300/20" />
              <div>
                {ev.href ? (
                  <Link href={ev.href} className="max-w-[260px] text-[12px] font-semibold leading-[16px] text-white/85 hover:underline">
                    {ev.title}
                  </Link>
                ) : (
                  <div className="max-w-[260px] text-[12px] font-semibold leading-[16px] text-white/85">{ev.title}</div>
                )}
                <div className="mt-1 text-[10px] text-white/55">{ev.meta}</div>
              </div>
            </div>
            <button type="button" className="rounded-[10px] p-2 text-white/45 hover:bg-white/10 hover:text-white/80">
              <FaEllipsisV className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

