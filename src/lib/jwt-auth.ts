import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET ?? "change-me-in-production-at-least-32-chars!!"
);

export type JwtPayload = {
  sub: string;
  email: string;
  role: string;
  tenantId: string | null;
};

/**
 * Extracts and verifies the Bearer JWT from the Authorization header.
 * Returns null if missing or invalid.
 */
export async function verifyRequestJwt(req: NextRequest): Promise<JwtPayload | null> {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as JwtPayload;
  } catch {
    return null;
  }
}

export function requireRole(payload: JwtPayload | null, roles: string[]): boolean {
  if (!payload) return false;
  return roles.includes(payload.role);
}
