import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt, requireRole } from "@/lib/jwt-auth";

/**
 * GET /api/admin/call-logs
 * Query params: agent_id, status, from, to, page, limit
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!requireRole(jwt, ["super_admin", "operations", "support"])) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const agentId   = searchParams.get("agent_id");
  const status    = searchParams.get("status");
  const fromTs    = searchParams.get("from");      // ISO date string
  const toTs      = searchParams.get("to");
  const page      = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit     = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset    = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("call_logs")
    .select(`
      id, retell_call_id, retell_agent_id, agent_id, call_status,
      start_timestamp, end_timestamp, duration_seconds,
      from_number, to_number, transcript, recording_url,
      call_cost, disconnection_reason, call_analysis, created_at,
      agents:agent_id (id, name, retell_agent_id)
    `, { count: "exact" })
    .order("start_timestamp", { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (agentId) query = query.eq("agent_id", agentId);
  if (status && status !== "all") query = query.eq("call_status", status);
  if (fromTs) query = query.gte("created_at", fromTs);
  if (toTs)   query = query.lte("created_at", toTs);

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/admin/call-logs]", error);
    return NextResponse.json({ error: "Failed to fetch call logs." }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [], total: count ?? 0, page, limit });
}
