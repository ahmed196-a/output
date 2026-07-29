import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { knowledge_base_ids = [] } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.knowledge_base_ids = knowledge_base_ids;

      await supabase
        .from("agents")
        .update({
          config,
          updated_at: new Date().toISOString(),
        })
        .eq("id", dbAgent.id);
    }

    return NextResponse.json({
      success: true,
      section: "knowledge",
      data: { knowledge_base_ids },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/knowledge]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Knowledge Base assignments" },
      { status: 500 }
    );
  }
}
