import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

/**
 * GET /api/call-logs
 * Returns call logs scoped to agents the user has access to.
 * Cost is calculated as ceil(duration_seconds / 60) * price_per_minute_snapshot
 * from the user's active subscription.
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? 50)));
  const offset = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  // Fetch the user's active subscription to get price_per_minute_snapshot
  let pricePerMinute: number | null = null;
  const { data: userRow } = await supabase
    .from("users")
    .select("active_subscription_id")
    .eq("id", jwt.sub)
    .single();

  if (userRow?.active_subscription_id) {
    const { data: subRow } = await supabase
      .from("subscriptions")
      .select("price_per_minute_snapshot")
      .eq("id", userRow.active_subscription_id)
      .single();
    if (subRow) {
      pricePerMinute = Number(subRow.price_per_minute_snapshot);
    }
  }

  let allowedAgentIds: string[] | null = null;

  if (!["super_admin", "operations"].includes(jwt.role)) {
    const { data: accessRows } = await supabase
      .from("user_agent_access")
      .select("agent_id")
      .eq("user_id", jwt.sub);

    allowedAgentIds = (accessRows ?? []).map((r) => r.agent_id);
    if (allowedAgentIds.length === 0) return NextResponse.json({ data: [], total: 0, page, limit });
  }

  let query = supabase
    .from("call_logs")
    .select(`
      id, retell_call_id, agent_id, call_status,
      start_timestamp, end_timestamp, duration_seconds,
      from_number, to_number, recording_url, call_cost,
      disconnection_reason, created_at,
      agents:agent_id (id, name)
    `, { count: "exact" })
    .order("start_timestamp", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (allowedAgentIds !== null) {
    query = query.in("agent_id", allowedAgentIds);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: "Failed to fetch call logs." }, { status: 500 });
  }

  // Attach calculated cost: ceil(duration_seconds / 60) * pricePerMinute
  const enriched = (data ?? []).map((row) => {
    let computedCost: number | null = null;
    if (pricePerMinute !== null && row.duration_seconds != null) {
        const billableMinutes = Math.ceil(Number(row.duration_seconds) / 60);
        console.log(`[Call Cost] call_id=${row.id} | duration_seconds=${row.duration_seconds} | billable_minutes=${billableMinutes} | price_per_minute=${pricePerMinute} | computed_cost=${(billableMinutes * pricePerMinute!).toFixed(2)}`);
        computedCost = Math.round(billableMinutes * pricePerMinute * 100) / 100;
    }
    return { ...row, call_cost: computedCost };
  });

  return NextResponse.json({ data: enriched, total: count ?? 0, page, limit });
}

