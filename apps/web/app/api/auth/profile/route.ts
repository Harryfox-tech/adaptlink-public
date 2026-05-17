import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiUpdateProfile, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  const body = (await request.json()) as { displayName?: string };
  try {
    const result = await apiUpdateProfile(token, { displayName: body.displayName ?? "" });
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "更新失败" }, { status: 400 });
  }
}

