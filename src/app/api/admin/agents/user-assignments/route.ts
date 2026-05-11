// src/app/api/admin/agents/user-assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_assistant_assignments")
    .select("id, user_id, assistant_id, assigned_at");
  if (error) return NextResponse.json({ error: "Failed." }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const { user_id, assistant_id } = await req.json();
  if (!user_id || !assistant_id)
    return NextResponse.json({ error: "user_id and assistant_id required." }, { status: 400 });

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("user_assistant_assignments")
    .upsert({ user_id, assistant_id, assigned_by: jwt!.sub }, { onConflict: "user_id" });
  if (error) return NextResponse.json({ error: "Failed." }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const { user_id } = await req.json();
  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("user_assistant_assignments")
    .delete()
    .eq("user_id", user_id);
  if (error) return NextResponse.json({ error: "Failed." }, { status: 500 });
  return NextResponse.json({ success: true });
}