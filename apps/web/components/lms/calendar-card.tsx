"use client";

import * as React from "react";
import Link from "next/link";
import { FaChevronDown } from "react-icons/fa";

export type CalendarItem = {
  time: string;
  title: string;
  meta: string;
  active?: boolean;
  href?: string;
};

const defaultItems: CalendarItem[] = [
  { time: "10:00", title: "简历解析", meta: "上传并生成分析报告", active: true },
  { time: "11:00", title: "能力评估", meta: "查看雷达图与指标", },
  { time: "12:00", title: "成长模拟", meta: "记录训练轨迹", },
  { time: "13:00", title: "求职模拟", meta: "面试场景对话", },
];

export function CalendarCard({
  title = "日程安排",
  subtitle = "今日 4 项",
  rangeLabel = "今日",
  items = defaultItems,
}: {
  title?: string;
  subtitle?: string;
  rangeLabel?: string;
  items?: CalendarItem[];
}) {
  return (
    <section className="rounded-[18px] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[14px] font-semibold text-white">{title}</div>
          <div className="mt-1 text-[10px] text-white/55">{subtitle}</div>
        </div>
        <button type="button" className="flex items-center gap-2 rounded-[10px] border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium text-white/70">
          {rangeLabel} <FaChevronDown className="h-3 w-3 text-white/45" />
        </button>
      </div>

      <div className="mt-4 space-y-4">
        {items.map((it) => (
          <div key={it.time} className="flex gap-4">
            <div className="w-[44px] pt-2 text-[11px] font-semibold text-white/55">{it.time}</div>
            <div className="relative flex-1">
              <div className="absolute left-[-18px] top-0 h-full w-[1px] bg-gradient-to-b from-white/0 via-cyan-300/20 to-white/0" />
              <div className="absolute left-[-23px] top-[14px] h-[10px] w-[10px] rounded-full bg-white/20" />
              {it.href ? (
                <Link
                  href={it.href}
                  className={
                    it.active
                      ? "block rounded-[16px] border border-cyan-300/20 bg-cyan-500/15 px-4 py-3 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                      : "block rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white/80 hover:bg-white/7 hover:shadow-[0_0_18px_rgba(34,211,238,0.10)]"
                  }
                >
                  <div className="text-[12px] font-semibold">{it.title}</div>
                  <div className={it.active ? "mt-1 text-[10px] text-white/85" : "mt-1 text-[10px] text-white/55"}>{it.meta}</div>
                </Link>
              ) : (
                <div
                  className={
                    it.active
                      ? "rounded-[16px] border border-cyan-300/20 bg-cyan-500/15 px-4 py-3 text-white shadow-[0_0_18px_rgba(34,211,238,0.16)]"
                      : "rounded-[16px] border border-white/10 bg-white/5 px-4 py-3 text-white/80"
                  }
                >
                  <div className="text-[12px] font-semibold">{it.title}</div>
                  <div className={it.active ? "mt-1 text-[10px] text-white/85" : "mt-1 text-[10px] text-white/55"}>{it.meta}</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

