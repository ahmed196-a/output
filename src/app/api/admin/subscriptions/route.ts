import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Step 1: fetch subscriptions
    const { data: subs, error: subsError } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        plan_id,
        status,
        started_at,
        ends_at,
        cancelled_at,
        minutes_used,
        monthly_price_snapshot,
        price_per_minute_snapshot,
        total_minutes_snapshot
      `)
      .order("started_at", { ascending: false });

    if (subsError) {
      console.error("[subscriptions] subs query error:", subsError);
      throw subsError;
    }

    if (!subs || subs.length === 0) {
      return NextResponse.json([]);
    }

    // Step 2: fetch user info for all user_ids in one query
    const userIds = [...new Set(subs.map((s: any) => s.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("id", userIds);

    if (usersError) {
      console.error("[subscriptions] users query error:", usersError);
      throw usersError;
    }

    const usersMap: Record<string, any> = {};
    (users ?? []).forEach((u: any) => {
      usersMap[u.id] = u;
    });

    // Step 3: fetch plan info for all plan_ids in one query
    const planIds = [...new Set(subs.map((s: any) => s.plan_id).filter(Boolean))];
    const { data: plans, error: plansError } = await supabase
      .from("plans")
      .select("id, display_name, name")
      .in("id", planIds);

    if (plansError) {
      console.error("[subscriptions] plans query error:", plansError);
      throw plansError;
    }

    const plansMap: Record<string, any> = {};
    (plans ?? []).forEach((p: any) => {
      plansMap[p.id] = p;
    });

    // Step 4: fetch assistant assignments for all user_ids
    const { data: assignments } = await supabase
      .from("user_assistant_assignments")
      .select("user_id, assistant_id")
      .in("user_id", userIds);

    const assignmentMap: Record<string, string> = {};
    (assignments ?? []).forEach((a: any) => {
      assignmentMap[a.user_id] = a.assistant_id;
    });

    // Step 5: fetch usage from call_logs per assistant
    const assistantIds = Object.values(assignmentMap);
    const usageMap: Record<string, number> = {};
    if (assistantIds.length > 0) {
      const { data: usageRows } = await supabase
        .from("cdrs")
        .select("assistant_id, total_seconds")
        .in("assistant_id", assistantIds);

      (usageRows ?? []).forEach((row: any) => {
        const aid = row.assistant_id;
        usageMap[aid] = (usageMap[aid] ?? 0) + (row.total_seconds ?? 0);
      });
    }

    // Step 6: merge everything
    const rows = subs.map((row: any) => {
      const user = usersMap[row.user_id] ?? {};
      const plan = plansMap[row.plan_id] ?? {};
      const assignedAgentId = assignmentMap[row.user_id] ?? null;
      const usageSeconds = assignedAgentId ? (usageMap[assignedAgentId] ?? 0) : 0;

      return {
        id: row.id,
        status: row.status,
        startedAt: row.started_at,
        endsAt: row.ends_at,
        cancelledAt: row.cancelled_at,
        minutesUsed: parseFloat(row.minutes_used ?? "0"),
        monthlyPrice: parseFloat(row.monthly_price_snapshot ?? "0"),
        pricePerMinute: parseFloat(row.price_per_minute_snapshot ?? "0"),
        totalMinutes: row.total_minutes_snapshot,
        userFullName: user.full_name ?? "—",
        userEmail: user.email ?? "—",
        userId: row.user_id,
        planDisplayName: plan.display_name ?? "—",
        planId: row.plan_id,
        usageMinutes: Math.round(usageSeconds / 60),
      };
    });

    return NextResponse.json(rows);
  } catch (err: any) {
    console.error("[GET /api/admin/subscriptions]", err);
    return NextResponse.json(
      { error: err?.message ?? "Failed to fetch subscriptions." },
      { status: 500 }
    );
  }
}