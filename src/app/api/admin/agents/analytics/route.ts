import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";
import { CallLogsOverview, AgentAnalytics } from "@/types/retell";

/**
 * GET /api/admin/agents/analytics
 * Returns aggregated call stats across all agents.
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // Fetch all call logs with agent join
  const { data: logs, error } = await supabase
    .from("call_logs")
    .select(`
      agent_id, call_status, duration_seconds, call_cost,
      agents:agent_id (id, name, retell_agent_id)
    `);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch analytics." }, { status: 500 });
  }

  const rows = logs ?? [];

  const total_calls = rows.length;
  const ongoing_calls = rows.filter((r) => r.call_status === "ongoing").length;
  const completed_calls = rows.filter((r) => r.call_status === "ended").length;
  const total_duration_seconds = rows.reduce((s, r) => s + (r.duration_seconds ?? 0), 0);
  const total_cost = rows.reduce((s, r) => s + Number(r.call_cost ?? 0), 0);

  // Per-agent aggregation
  const agentMap = new Map<string, AgentAnalytics>();

  for (const row of rows) {
    if (!row.agent_id) continue;
    const agentInfo = row.agents as { id: string; name: string; retell_agent_id: string } | null;
    if (!agentInfo) continue;

    if (!agentMap.has(row.agent_id)) {
      agentMap.set(row.agent_id, {
        agent_id: row.agent_id,
        agent_name: agentInfo.name,
        retell_agent_id: agentInfo.retell_agent_id,
        total_calls: 0,
        completed_calls: 0,
        total_duration_seconds: 0,
        avg_duration_seconds: 0,
        total_cost: 0,
        success_rate: 0,
      });
    }

    const entry = agentMap.get(row.agent_id)!;
    entry.total_calls++;
    if (row.call_status === "ended") entry.completed_calls++;
    entry.total_duration_seconds += row.duration_seconds ?? 0;
    entry.total_cost += Number(row.call_cost ?? 0);
  }

  // Compute derived fields
  const per_agent: AgentAnalytics[] = [];
  for (const entry of agentMap.values()) {
    entry.avg_duration_seconds = entry.completed_calls > 0
      ? Math.round(entry.total_duration_seconds / entry.completed_calls)
      : 0;
    entry.success_rate = entry.total_calls > 0
      ? Math.round((entry.completed_calls / entry.total_calls) * 100)
      : 0;
    per_agent.push(entry);
  }

  per_agent.sort((a, b) => b.total_calls - a.total_calls);

  const overview: CallLogsOverview = {
    total_calls,
    ongoing_calls,
    completed_calls,
    total_duration_seconds,
    total_cost: Math.round(total_cost * 10000) / 10000,
    per_agent,
  };

  return NextResponse.json(overview);
}
