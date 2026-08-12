"use client";

import Link from "next/link";
import * as React from "react";
import { platformNavMap, platformRoleName } from "@/lib/platform-nav";
import { PlatformRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader({ role, title, pathname }: { role: PlatformRole; title: string; pathname: string }) {
  const roleNav = platformNavMap[role];
  const [me, setMe] = React.useState<{ user: { role: PlatformRole; email: string; display_name: string } | null } | null>(null);
  const [editing, setEditing] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [saveError, setSaveError] = React.useState<string | null>(null);

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
    setSaveError(null);
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
    } catch (e: any) {
      setSaveError(e?.message ?? "更新失败");
    } finally {
      setSaving(false);
    }
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6">
        <div className="surface-panel flex h-14 items-center justify-between px-4 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="font-display shrink-0 text-sm font-semibold tracking-tight text-white">
              AdaptLink
            </Link>
            <span className="hidden truncate rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/60 md:inline-flex">
              {platformRoleName[role]} · {title}
            </span>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {(["student", "enterprise", "school"] as PlatformRole[]).map((r) => (
              <Link
                key={r}
                href={`/${r}/dashboard`}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition duration-200",
                  role === r
                    ? "bg-cyan-500/12 text-cyan-100 ring-1 ring-cyan-400/20"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                {platformRoleName[r].replace("端", "")}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between gap-3 pb-1 lg:hidden">
          <nav className="flex h-9 flex-1 items-center gap-3 overflow-x-auto whitespace-nowrap text-xs">
            {roleNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "shrink-0 transition-colors duration-200",
                    active ? "font-medium text-cyan-200" : "text-white/55 hover:text-white",
                  )}
                >
                  {item.shortLabel ?? item.label}
                </Link>
              );
            })}
          </nav>

          <div className="shrink-0">
            {me?.user ? (
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/75">
                {!editing ? (
                  <>
                    <span className="max-w-[88px] truncate font-medium">{me.user.display_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-white/70 hover:bg-white/10 hover:text-white"
                      onClick={() => setEditing(true)}
                    >
                      编辑
                    </Button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Input
                      className="h-7 w-28 border-white/10 bg-white/5 text-white placeholder:text-white/40"
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                    <Button size="sm" className="h-7 px-2" disabled={saving} onClick={saveProfile}>
                      保存
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <Link className="text-xs font-medium text-cyan-300 hover:text-cyan-200" href={`/login?role=${role}`}>
                登录
              </Link>
            )}
          </div>
        </div>

        <div className="hidden items-center justify-end pb-1 lg:flex">
          {me?.user ? (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/80">
              <span className="rounded-md border border-white/10 px-2 py-0.5 text-white/60">
                {platformRoleName[me.user.role]}
              </span>
              {!editing ? (
                <>
                  <span className="font-medium">{me.user.display_name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-white/75 hover:bg-white/10 hover:text-white"
                    onClick={() => setEditing(true)}
                  >
                    编辑
                  </Button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    className="h-7 w-40 border border-white/10 bg-white/5 text-white placeholder:text-white/40"
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                  <Button size="sm" className="h-7 px-2" disabled={saving} onClick={saveProfile}>
                    {saving ? "保存中" : "保存"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2"
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
            <Link className="text-xs font-semibold text-cyan-300 hover:text-cyan-200" href={`/login?role=${role}`}>
              去登录
            </Link>
          )}
        </div>

        {saveError ? <div className="pb-2 text-xs text-rose-300">{saveError}</div> : null}
      </div>
    </header>
  );
}
