import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AUTH_COOKIE, ROLE_COOKIE } from "@/lib/auth-constants";

const AUTH_PAGES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

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

function isAuthPage(pathname: string) {
  return AUTH_PAGES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

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

  if (isAuthPage(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/projects/:path*",
    "/tasks/:path*",
    "/announcements/:path*",
    "/events/:path*",
    "/calendar/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/admin/:path*",
  ],
};
