import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME =
  process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME ?? "voiceos_auth_token";
const ROLE_COOKIE_NAME = "voiceos_user_role";

/**
 * Roles that are allowed inside the /admin section.
 * Matches the AdminRole type in src/types/admin/roles.ts
 */
const ADMIN_ROLES = new Set([
  "super_admin",
  "operations",
  "support",
  "finance",
]);

const USER_PROTECTED = [
  "/dashboard",
  "/agents",
  "/call-logs",
  "/recordings",
  "/billing",
  "/settings",
];
const ADMIN_PROTECTED = ["/admin"];

function matchesPrefix(pathname: string, prefixes: string[]) {
  return prefixes.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const role = request.cookies.get(ROLE_COOKIE_NAME)?.value ?? "";

  const isUserRoute = matchesPrefix(pathname, USER_PROTECTED);
  const isAdminRoute = matchesPrefix(pathname, ADMIN_PROTECTED);

  // 1. Unauthenticated → redirect to login
  if ((isUserRoute || isAdminRoute) && !hasSession) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated but not an admin role → redirect to dashboard
  if (isAdminRoute && !ADMIN_ROLES.has(role)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // 3. Already logged-in user hitting /auth/login → send to their home
  if (pathname.startsWith("/auth/login") && hasSession) {
    const dest = ADMIN_ROLES.has(role) ? "/admin/overview" : "/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/agents/:path*",
    "/call-logs/:path*",
    "/recordings/:path*",
    "/billing/:path*",
    "/settings/:path*",
    "/admin/:path*",
    "/auth/login",
  ],
};
