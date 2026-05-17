import type { PlatformRole } from "@/lib/types";

export const AUTH_COOKIE_NAME = "platform_token";

type AuthUser = {
  id: string;
  role: PlatformRole;
  email: string;
  display_name: string;
};

type AuthSessionResponse = {
  token: string;
  user: AuthUser;
};

type AuthMeResponse = {
  user: AuthUser | null;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export async function apiRegister(input: {
  role: PlatformRole;
  email: string;
  password: string;
  displayName: string;
  companyId?: string;
}) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: input.role,
      email: input.email,
      password: input.password,
      display_name: input.displayName,
      ...(input.role === "enterprise" && input.companyId?.trim()
        ? { company_id: input.companyId.trim() }
        : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.detail ?? "注册失败");
  return data as AuthSessionResponse;
}

export async function apiLogin(input: { role: PlatformRole; email: string; password: string; companyId?: string }) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      role: input.role,
      email: input.email,
      password: input.password,
      ...(input.role === "enterprise" && input.companyId?.trim()
        ? { company_id: input.companyId.trim() }
        : {}),
    }),
    cache: "no-store",
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.detail ?? "登录失败");
  return data as AuthSessionResponse;
}

export async function apiRegisterCompany(input: { name: string }) {
  const res = await fetch(`${API_BASE}/auth/companies/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: input.name }),
    cache: "no-store",
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(typeof data?.detail === "string" ? data.detail : "公司注册失败");
  return data as { company_id: string; name: string };
}

export async function apiMe(token: string | null) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.detail ?? "获取用户失败");
  return data as AuthMeResponse;
}

export async function apiLogout(token: string | null) {
  await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
}

export async function apiUpdateProfile(token: string | null, input: { displayName: string }) {
  const res = await fetch(`${API_BASE}/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ display_name: input.displayName }),
    cache: "no-store",
  });
  const data = (await res.json()) as any;
  if (!res.ok) throw new Error(data?.detail ?? "更新失败");
  return data as { user: AuthUser };
}

