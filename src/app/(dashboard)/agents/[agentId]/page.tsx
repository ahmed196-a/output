import { notFound } from "next/navigation";
import { AgentEditorShell } from "@/components/agents/editor/agent-editor-shell";
import { getRetellAgent } from "@/lib/retell-api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

type AgentDetailPageProps = {
  params: Promise<{
    agentId: string;
  }>;
};

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { agentId } = await params;

  let agentData: any = null;

  try {
    const supabase = createServerSupabaseClient();
    const { data: dbRow } = await supabase
      .from("agents")
      .select("*")
      .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
      .single();

    if (dbRow) {
      try {
        const live = await getRetellAgent(dbRow.retell_agent_id || agentId);
        agentData = {
          ...dbRow,
          ...live,
          id: dbRow.id,
          agent_id: dbRow.retell_agent_id || agentId,
          name: live.agent_name || dbRow.name,
        };
      } catch {
        agentData = {
          ...dbRow,
          agent_id: dbRow.retell_agent_id || agentId,
        };
      }
    } else {
      const live = await getRetellAgent(agentId);
      agentData = {
        id: live.agent_id,
        agent_id: live.agent_id,
        name: live.agent_name || "Voice Agent",
        voice_id: live.voice_id || "retell-Cimo",
        language: live.language || "en-US",
        response_engine: live.response_engine || { type: "retell-llm" },
        begin_message: live.begin_message || "",
        general_prompt: live.general_prompt || "",
      };
    }
  } catch (err) {
    console.error("[AgentDetailPage Error]", err);
  }

  if (!agentData) {
    notFound();
  }

  return <AgentEditorShell agent={agentData} />;
}
