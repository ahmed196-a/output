import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";  // ← ADD THIS

const N8N_WEBHOOK_URL = "https://n8n-dev.callautomate.ai/webhook/register-user";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const password_hash = await bcrypt.hash(body.password, 12);  // ← ADD THIS

    const n8nRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        full_name:         body.full_name,
        email:             body.email,
        password:          body.password,
        password_hash,                      // ← send this to n8n
        plan_id:           body.plan_id,
        plan_name:         body.plan_name,
        stripe_session_id: body.stripe_session_id,
        
      }),
    });

    const data = await n8nRes.json().catch(() => ({}));

    if (!n8nRes.ok) {
      return NextResponse.json(
        { message: data?.message ?? "Registration failed." },
        { status: n8nRes.status }
      );
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[/api/register]", err);
    return NextResponse.json({ message: "Internal server error." }, { status: 500 });
  }
}