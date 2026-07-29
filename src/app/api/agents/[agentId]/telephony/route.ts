import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { phone_numbers = [], routing_config = {} } = body;

    const supabase = createServerSupabaseClient();

    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.telephony = { phone_numbers, routing_config };

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
      section: "telephony",
      data: { phone_numbers, routing_config },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/telephony]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update Telephony configuration" },
      { status: 500 }
    );
  }
}
