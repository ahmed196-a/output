// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 *
 * Clears the HttpOnly "token" cookie that was set by /api/auth/login.
 * Client-side logout (clearAuthSession) already clears localStorage and
 * the "voiceos_auth_token" presence cookie, but it cannot touch the
 * HttpOnly cookie — only the server can do that.
 *
 * Without this, a logged-out user still carries the "token" cookie,
 * which makes /api/checkout think they are logged in and sends them
 * to /dashboard instead of /auth/register after a guest purchase.
 */
export async function POST() {
  const response = NextResponse.json({ success: true });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}