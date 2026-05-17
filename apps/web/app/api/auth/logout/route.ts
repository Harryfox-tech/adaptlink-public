import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiLogout, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export const runtime = "nodejs";

export async function POST() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  await apiLogout(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

