"use client";

import * as React from "react";
import Link from "next/link";
import { FaEnvelope, FaPhoneAlt } from "react-icons/fa";

export type LinkedItem = {
  name: string;
  subtitle: string;
  href?: string;
};

const defaultItems: LinkedItem[] = [
  { name: "Mary Johnson (mentor)", subtitle: "Science" },
  { name: "James Brown", subtitle: "Foreign language (Chinese)" },
];

export function LinkedTeachersCard({
  title = "关联导师",
  actionLabel = "查看全部",
  actionHref = "#",
  items = defaultItems,
}: {
  title?: string;
  actionLabel?: string;
  actionHref?: string;
  items?: LinkedItem[];
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
        {items.map((t) => (
          <div
            key={t.name}
            className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/7 hover:shadow-[0_0_18px_rgba(34,211,238,0.10)]"
          >
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-blue-500/12 ring-1 ring-white/10" />
              <div>
                {t.href ? (
                  <Link href={t.href} className="text-[12px] font-semibold text-white/85 hover:underline">
                    {t.name}
                  </Link>
                ) : (
                  <div className="text-[12px] font-semibold text-white/85">{t.name}</div>
                )}
                <div className="text-[10px] text-white/55">{t.subtitle}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white/55">
              <button type="button" className="rounded-[10px] p-2 hover:bg-white/10 hover:text-white/80">
                <FaEnvelope className="h-[14px] w-[14px]" />
              </button>
              <button type="button" className="rounded-[10px] p-2 hover:bg-white/10 hover:text-white/80">
                <FaPhoneAlt className="h-[14px] w-[14px]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

