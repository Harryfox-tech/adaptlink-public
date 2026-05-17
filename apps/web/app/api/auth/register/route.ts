import { NextResponse } from "next/server";
import { apiRegister, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    role?: any;
    email?: string;
    password?: string;
    displayName?: string;
    companyId?: string;
    developerKey?: string;
  };
  try {
    const session = await apiRegister({
      role: body.role,
      email: body.email ?? "",
      password: body.password ?? "",
      displayName: body.displayName ?? "",
      companyId: body.companyId,
      developerKey: body.developerKey,
    });
    const res = NextResponse.json({ user: session.user });
    res.cookies.set(AUTH_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "注册失败" }, { status: 400 });
  }
}

