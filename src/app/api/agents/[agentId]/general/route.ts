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
    const { name, provider, description, language, timezone, fallback_language } = body;

    const supabase = createServerSupabaseClient();

    // 1. Update local database
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (name) updateData.name = name;
    if (language) updateData.language = language;

    // Fetch existing agent to get retell_agent_id
    const { data: dbAgent } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbAgent) {
      const config = dbAgent.config || {};
      config.general = {
        ...config.general,
        name: name || dbAgent.name,
        provider: provider || config.general?.provider || "retell",
        description,
        language: language || dbAgent.language,
        timezone,
        fallback_language,
      };

      await supabase
        .from("agents")
        .update({
          ...updateData,
          config,
        })
        .eq("id", dbAgent.id);

      // 2. Sync to Retell API if applicable
      if (dbAgent.retell_agent_id && (name || language)) {
        try {
          await updateRetellAgent(dbAgent.retell_agent_id, {
            agent_name: name,
            language,
          });
        } catch (err) {
          console.warn("[General Section Sync Warn]", err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      section: "general",
      data: { name, provider, description, language, timezone, fallback_language },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/general]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update general settings" },
      { status: 500 }
    );
  }
}
