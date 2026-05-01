import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";
import { createRetellAgent } from "@/lib/retell-api";
import { CreateRetellAgentPayload } from "@/types/retell";

export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from("agents")
    .select(`
      id, retell_agent_id, name, voice_id, language, response_engine,
      llm_websocket_url, begin_message, general_prompt, config,
      created_by, tenant_id, is_active, created_at, updated_at
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/admin/agents]", error);
    return NextResponse.json({ error: "Failed to fetch agents." }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin"])) {
    return NextResponse.json({ error: "Only super_admin can create agents." }, { status: 403 });
  }

  let body: CreateRetellAgentPayload;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const {
    name, voice_id, language, response_engine, llm_websocket_url,
    begin_message, general_prompt, assign_user_ids = []
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Agent name is required." }, { status: 400 });
  }

  try {
    // Build Retell payload — only include fields that have actual values
    // Retell rejects empty strings for optional fields like voice_id
    const retellPayload: Record<string, unknown> = {
      agent_name: name.trim(),
      language: language ?? "en-US",
      response_engine: response_engine === "custom-llm" && llm_websocket_url
        ? { type: "custom_llm", llm_websocket_url }
        : { type: "retell-llm" },
    };

    if (voice_id && voice_id.trim()) retellPayload.voice_id = voice_id.trim();
    if (begin_message && begin_message.trim()) retellPayload.begin_message = begin_message.trim();
    if (general_prompt && general_prompt.trim()) retellPayload.general_prompt = general_prompt.trim();

    console.log("[POST /api/admin/agents] Sending to Retell:", JSON.stringify(retellPayload));

    // 1. Create the agent on Retell
    const retellAgent = await createRetellAgent(retellPayload as Parameters<typeof createRetellAgent>[0]);

    console.log("[POST /api/admin/agents] Retell response:", JSON.stringify(retellAgent));

    // 2. Persist to Supabase
    const supabase = createServerSupabaseClient();

    const { data: agentRow, error: insertError } = await supabase
      .from("agents")
      .insert({
        retell_agent_id: retellAgent.agent_id,
        name: name.trim(),
        voice_id: retellAgent.voice_id ?? null,
        language: retellAgent.language ?? "en-US",
        response_engine: retellAgent.response_engine?.type ?? "retell-llm",
        llm_websocket_url: retellAgent.response_engine?.llm_websocket_url ?? null,
        begin_message: begin_message?.trim() || null,
        general_prompt: general_prompt?.trim() || null,
        config: retellAgent,
        created_by: jwt!.sub,
        tenant_id: jwt!.tenantId,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 3. Grant access to specified users (if any)
    if (assign_user_ids.length > 0 && agentRow) {
      const accessRows = assign_user_ids.map((uid) => ({
        user_id: uid,
        agent_id: agentRow.id,
        granted_by: jwt!.sub,
      }));

      const { error: accessError } = await supabase
        .from("user_agent_access")
        .insert(accessRows);

      if (accessError) {
        console.warn("[POST /api/admin/agents] user_agent_access insert warn:", accessError);
      }
    }

    return NextResponse.json(agentRow, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/agents] Full error:", err);
    const message = err instanceof Error ? err.message : "Internal server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}