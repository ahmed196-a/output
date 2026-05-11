import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { createServerSupabaseClient } from "@/lib/supabase-server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_JWT_SECRET ?? "change-me-in-production-at-least-32-chars!!"
);

const SESSION_HOURS = Number(process.env.NEXT_PUBLIC_AUTH_SESSION_DURATION_HOURS ?? 8);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email: string = (body.email ?? "").toLowerCase().trim();
    const password: string = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Fetch user row (email is stored lower-cased via the index)
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, tenant_id, password_hash, is_active")
      .ilike("email", email)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Your account is disabled. Contact your administrator." },
        { status: 403 }
      );
    }

    // Constant-time password comparison
    const passwordValid = await bcrypt.compare(password, user.password_hash);
    if (!passwordValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const expiresAt = Date.now() + SESSION_HOURS * 60 * 60 * 1000;

    // Sign a JWT with the user's id + role embedded
    const accessToken = await new SignJWT({
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenant_id ?? null,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(`${SESSION_HOURS}h`)
      .sign(JWT_SECRET);

    const response = NextResponse.json({
      accessToken,
      expiresAt,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        tenantId: user.tenant_id ?? null,
      },
    });

    response.cookies.set("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_HOURS * 60 * 60,
    });
    
    return response;
  } catch (err) {
    console.error("[/api/auth/login]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
