import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";
import { updateRetellAgent, deleteRetellAgent } from "@/lib/retell-api";

type Params = { params: Promise<{ agentId: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("agents")
    .select("*, call_logs(id, call_status, duration_seconds, call_cost, start_timestamp)")
    .eq("id", agentId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can update agents." }, { status: 403 });
  }

  const body = await req.json();
  const supabase = createServerSupabaseClient();

  // Find existing agent
  const { data: existing } = await supabase
    .from("agents")
    .select("retell_agent_id")
    .eq("id", agentId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  try {
    // Update on Retell
    const updated = await updateRetellAgent(existing.retell_agent_id, {
      agent_name: body.name,
      voice_id: body.voice_id,
      language: body.language,
      begin_message: body.begin_message,
      general_prompt: body.general_prompt,
    });

    // Update local DB
    const { data, error } = await supabase
      .from("agents")
      .update({
        name: body.name ?? undefined,
        voice_id: body.voice_id ?? undefined,
        language: body.language ?? undefined,
        begin_message: body.begin_message ?? undefined,
        general_prompt: body.general_prompt ?? undefined,
        config: updated,
      })
      .eq("id", agentId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/agents/:id]", err);
    const message = err instanceof Error ? err.message : "Update failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { agentId } = await params;
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can delete agents." }, { status: 403 });
  }

  const supabase = createServerSupabaseClient();
  const { data: existing } = await supabase
    .from("agents")
    .select("retell_agent_id")
    .eq("id", agentId)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Agent not found." }, { status: 404 });
  }

  try {
    await deleteRetellAgent(existing.retell_agent_id);

    // Soft-delete locally
    await supabase.from("agents").update({ is_active: false }).eq("id", agentId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/agents/:id]", err);
    const message = err instanceof Error ? err.message : "Delete failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
