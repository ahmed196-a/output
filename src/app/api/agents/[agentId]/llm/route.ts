import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.llm = { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url };

      await supabase
        .from("agents")
        .update({
          llm_websocket_url: custom_websocket_url || dbAgent.llm_websocket_url,
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);
    }

    return NextResponse.json({
      success: true,
      section: "llm",
      data: { model, temperature, top_p, presence_penalty, frequency_penalty, custom_websocket_url },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/llm]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update LLM settings" },
      { status: 500 }
    );
  }
}
