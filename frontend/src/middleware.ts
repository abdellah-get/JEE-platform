import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE, ROLE_COOKIE } from "@/lib/auth-constants";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/projects",
  "/tasks",
  "/announcements",
  "/events",
  "/calendar",
  "/notifications",
  "/profile",
  "/admin",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.get(AUTH_COOKIE)?.value === "1";
  const role = request.cookies.get(ROLE_COOKIE)?.value;

  if (isProtected(pathname) && !hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && role !== "BUREAU" && role !== "ADMIN_TECH") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Do NOT bounce /login → /dashboard based on jee_auth alone.
  // That cookie is a non-secret hint and can outlive a dead refresh cookie,
  // which caused events/calendar ↔ login flicker ending at ?next=/dashboard.
  // AuthProvider + login page redirect only after a successful refresh.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard",
    "/dashboard/:path*",
    "/projects",
    "/projects/:path*",
    "/tasks",
    "/tasks/:path*",
    "/announcements",
    "/announcements/:path*",
    "/events",
    "/events/:path*",
    "/calendar",
    "/calendar/:path*",
    "/notifications",
    "/notifications/:path*",
    "/profile",
    "/profile/:path*",
    "/admin",
    "/admin/:path*",
  ],
};
