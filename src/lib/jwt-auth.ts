import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET ??
    "change-me-in-production-at-least-32-chars!!"
);

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
};

export async function verifyRequestJwt(
  req: NextRequest
): Promise<JwtPayload | null> {
  try {
    let token: string | null = null;

    // 1. Try Authorization header first
    const authHeader = req.headers.get("authorization") ?? "";

    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }

    // Note: the auth cookie only holds a presence flag ("1"), not the JWT.
    // The real token must come from the Authorization header (set by apiClient).
    // No cookie fallback.

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);

    return payload as unknown as JwtPayload;
  } catch (err) {
    console.error("JWT VERIFY ERROR:", err);
    return null;
  }
}

export function requireRole(
  payload: JwtPayload | null,
  roles: string[]
): boolean {
  if (!payload) return false;

  return roles.includes(payload.role);
}