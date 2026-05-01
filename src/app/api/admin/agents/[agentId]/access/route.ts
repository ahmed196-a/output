import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

/**
 * GET  /api/admin/agents/[agentId]/access  — list users with access
 * POST /api/admin/agents/[agentId]/access  — grant access to user(s)
 * DELETE body: { user_ids: string[] }       — revoke access
 */

type Params = { params: Promise<{ agentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("user_agent_access")
    .select("id, user_id, granted_at, granted_by, users:user_id(id, full_name, email, role)")
    .eq("agent_id", agentId)
    .order("granted_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Failed to fetch access list." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can grant agent access." }, { status: 403 });
  }

  const { user_ids } = await req.json() as { user_ids: string[] };
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const rows = user_ids.map((uid) => ({
    user_id: uid,
    agent_id: agentId,
    granted_by: jwt!.sub,
  }));

  const { error } = await supabase
    .from("user_agent_access")
    .upsert(rows, { onConflict: "user_id,agent_id" });

  if (error) {
    return NextResponse.json({ error: "Failed to grant access." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can revoke agent access." }, { status: 403 });
  }

  const { user_ids } = await req.json() as { user_ids: string[] };
  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    return NextResponse.json({ error: "user_ids array is required." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();
  const { error } = await supabase
    .from("user_agent_access")
    .delete()
    .eq("agent_id", agentId)
    .in("user_id", user_ids);

  if (error) {
    return NextResponse.json({ error: "Failed to revoke access." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
