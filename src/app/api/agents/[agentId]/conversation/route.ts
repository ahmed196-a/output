import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { updateRetellAgent } from "@/lib/retell-api";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { begin_message, general_prompt, temperature, interruption_sensitivity, silence_timeout, voice_speed } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.conversation = {
        ...config.conversation,
        begin_message,
        general_prompt,
        temperature,
        interruption_sensitivity,
        silence_timeout,
        voice_speed,
      };

      await supabase
        .from("agents")
        .update({
          begin_message: begin_message ?? dbAgent.begin_message,
          general_prompt: general_prompt ?? dbAgent.general_prompt,
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);

      if (dbAgent.retell_agent_id) {
        try {
          await updateRetellAgent(dbAgent.retell_agent_id, {
            begin_message,
            general_prompt,
          });
        } catch (err) {
          console.warn("[Conversation Section Sync Warn]", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      section: "conversation",
      data: { begin_message, general_prompt, temperature, interruption_sensitivity, silence_timeout, voice_speed },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/conversation]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update conversation prompt" },
      { status: 500 }
    );
  }
}
