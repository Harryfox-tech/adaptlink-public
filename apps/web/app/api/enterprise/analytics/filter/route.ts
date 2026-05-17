import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "@/lib/auth-client";

export const runtime = "nodejs";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const body = await request.json();

  const res = await fetch(`${API_BASE}/enterprise/analytics/filter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const data = await res.json().catch(() => ({}));
  return NextResponse.json(data, { status: res.status });
}

