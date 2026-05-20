// src/app/api/billing/subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = payload.sub;
  const supabase = createServerSupabaseClient();

  // Get user's active subscription
  const { data: user, error } = await supabase
    .from("users")
    .select(`
      id,
      full_name,
      email,
      active_subscription_id,
      subscriptions!users_active_subscription_id_fkey (
        id,
        status,
        started_at,
        ends_at,
        cancelled_at,
        minutes_used,
        monthly_price_snapshot,
        price_per_minute_snapshot,
        total_minutes_snapshot,
        plans ( display_name )
      )
    `)
    .eq("id", userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  // Get CDR usage for this user's assigned assistant
  const { data: assignment } = await supabase
    .from("user_assistant_assignments")
    .select("assistant_id")
    .eq("user_id", userId)
    .single();

  let usageMinutes = 0;
  if (assignment?.assistant_id) {
    const { data: usageRows } = await supabase
      .from("cdrs")
      .select("total_seconds")
      .eq("assistant_id", assignment.assistant_id);

    const totalSeconds = (usageRows ?? []).reduce(
      (sum: number, row: any) => sum + (row.total_seconds ?? 0),
      0
    );
    usageMinutes = Math.round(totalSeconds / 60);
  }

  const sub = (user as any).subscriptions;

  return NextResponse.json({
    subscription: sub
      ? {
          id: sub.id,
          status: sub.status,
          planName: sub.plans?.display_name ?? "—",
          startedAt: sub.started_at,
          endsAt: sub.ends_at,
          cancelledAt: sub.cancelled_at,
          minutesUsed: parseFloat(sub.minutes_used ?? "0"),
          totalMinutes: sub.total_minutes_snapshot,
          monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
          pricePerMinute: parseFloat(sub.price_per_minute_snapshot ?? "0"),
        }
      : null,
    usageMinutes,
  });
}