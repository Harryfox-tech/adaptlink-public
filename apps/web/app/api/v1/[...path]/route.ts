import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

function buildBackendUrl(path: string[], search: string) {
  const route = path.join("/");
  return `${BACKEND_BASE}/${route}${search}`;
}

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: NextRequest, params: { path: string[] }) {
  const url = buildBackendUrl(params.path, request.nextUrl.search);

  const headers = new Headers(request.headers);
  headers.set("host", new URL(BACKEND_BASE).host);
  headers.delete("content-length");

  const body = ["GET", "HEAD"].includes(request.method) ? undefined : await request.arrayBuffer();

  const response = await fetch(url, {
    method: request.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}

export async function OPTIONS(request: NextRequest, context: RouteContext) {
  return proxy(request, await context.params);
}
