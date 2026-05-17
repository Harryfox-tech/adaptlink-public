import { NextResponse } from "next/server";
import { apiRegisterCompany } from "@/lib/auth-client";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { name?: string };
  try {
    const data = await apiRegisterCompany({ name: body.name ?? "" });
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "公司注册失败" }, { status: 400 });
  }
}
