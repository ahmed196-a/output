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
    const { voice_id, provider, speed, pitch } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.voice = { ...config.voice, voice_id, provider, speed, pitch };

      await supabase
        .from("agents")
        .update({
          voice_id: voice_id || dbAgent.voice_id,
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);

      if (dbAgent.retell_agent_id && voice_id) {
        try {
          await updateRetellAgent(dbAgent.retell_agent_id, { voice_id });
        } catch (err) {
          console.warn("[Voice Section Sync Warn]", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      section: "voice",
      data: { voice_id, provider, speed, pitch },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/voice]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update voice configuration" },
      { status: 500 }
    );
  }
}
