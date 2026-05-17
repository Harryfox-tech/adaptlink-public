"use client";

import * as React from "react";
import Link from "next/link";
import { FaSearch, FaChevronDown, FaEnvelope, FaBell } from "react-icons/fa";
import { PlatformRole } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const roleText: Record<PlatformRole, string> = {
  student: "学生端",
  enterprise: "企业端",
  school: "高校端",
};

export function LmsTopHeader() {
  const [me, setMe] = React.useState<{ user: { role: PlatformRole; email: string; display_name: string } | null } | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await res.json()) as any;
        if (!cancelled) {
          setMe(data);
          setDraftName(data?.user?.display_name ?? "");
        }
      } catch {
        if (!cancelled) setMe({ user: null });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: draftName }),
      });
      const data = (await res.json()) as any;
      if (!res.ok) throw new Error(data?.error ?? "更新失败");
      setMe({ user: data.user });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="flex h-[56px] items-center justify-between rounded-[18px] border border-white/10 bg-white/5 px-5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] ring-1 ring-white/5">
      <div className="flex w-[340px] items-center gap-3 rounded-[12px] border border-white/10 bg-white/5 px-4 py-2.5">
        <FaSearch className="h-4 w-4 text-white/45" />
        <input
          className="w-full bg-transparent text-[13px] text-white/85 placeholder:text-white/35 focus:outline-none"
          placeholder="Search"
        />
      </div>

      <div className="flex items-center gap-4 text-white/80">
        <button type="button" className="flex items-center gap-2 rounded-[10px] px-2 py-2 text-[12px] font-semibold hover:bg-white/10 hover:text-white">
          <span className="tracking-wide">ENG</span>
          <FaChevronDown className="h-3 w-3 text-white/45" />
        </button>

        <button type="button" className="rounded-[10px] p-2 hover:bg-white/10 hover:text-white">
          <FaEnvelope className="h-[15px] w-[15px] text-white/55" />
        </button>
        <button type="button" className="rounded-[10px] p-2 hover:bg-white/10 hover:text-white">
          <FaBell className="h-[15px] w-[15px] text-white/55" />
        </button>

        {me?.user ? (
          <div className="flex items-center gap-2 rounded-[14px] border border-white/10 bg-white/5 px-2 py-1.5 hover:bg-white/10">
            <span className="h-8 w-8 rounded-full bg-cyan-500/12 ring-1 ring-white/10" />
            <span className="hidden rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] font-semibold text-white/70 md:inline-flex">
              {roleText[me.user.role]}
            </span>
            {!editing ? (
              <>
                <span className="text-[13px] font-semibold text-white">{me.user.display_name}</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-[12px]" onClick={() => setEditing(true)}>
                  编辑
                </Button>
                <FaChevronDown className="h-3 w-3 text-white/45" />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Input className="h-7 w-36 text-[12px]" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                <Button size="sm" className="h-7 px-2 text-[12px]" disabled={saving} onClick={saveProfile}>
                  {saving ? "保存中" : "保存"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[12px]"
                  onClick={() => {
                    setEditing(false);
                    setDraftName(me.user?.display_name ?? "");
                  }}
                >
                  取消
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Link className="rounded-[12px] border border-white/10 bg-white/5 px-4 py-2 text-[12px] font-semibold text-white/80 hover:bg-white/10 hover:text-white" href="/login">
            去登录
          </Link>
        )}
      </div>
    </header>
  );
}

