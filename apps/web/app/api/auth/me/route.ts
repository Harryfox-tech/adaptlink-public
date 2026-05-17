import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { apiMe, AUTH_COOKIE_NAME } from "@/lib/auth-client";

export const runtime = "nodejs";

export async function GET() {
  const token = (await cookies()).get(AUTH_COOKIE_NAME)?.value ?? null;
  try {
    const data = await apiMe(token);
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ user: null });
  }
}

