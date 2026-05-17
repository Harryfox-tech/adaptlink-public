import { NextResponse, type NextRequest } from "next/server";
import type { PlatformRole } from "@/lib/types";

function requiredRoleFromPath(pathname: string): PlatformRole | null {
  if (pathname.startsWith("/student")) return "student";
  if (pathname.startsWith("/enterprise")) return "enterprise";
  if (pathname.startsWith("/school")) return "school";
  return null;
}

function homeByRole(role: PlatformRole) {
  switch (role) {
    case "student":
      return "/student/dashboard";
    case "enterprise":
      return "/enterprise/dashboard";
    case "school":
      return "/school/dashboard";
  }
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const required = requiredRoleFromPath(pathname);
  if (!required) return NextResponse.next();

  const meUrl = new URL("/api/auth/me", request.url);
  const meRes = await fetch(meUrl, {
    headers: { cookie: request.headers.get("cookie") ?? "" },
    cache: "no-store",
  });
  const me = (await meRes.json()) as { user: { role: PlatformRole } | null };

  if (!me.user) {
    const url = new URL(`/login?role=${required}`, request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (me.user.role !== required) {
    return NextResponse.redirect(new URL(homeByRole(me.user.role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/student/:path*", "/enterprise/:path*", "/school/:path*"],
};

