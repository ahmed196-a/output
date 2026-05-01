import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// GET /api/admin/billing — all non-admin users with their active subscription billing info
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        full_name,
        email,
        role,
        is_active,
        created_at,
        active_subscription_id,
        subscriptions!users_active_subscription_id_fkey (
          id,
          status,
          started_at,
          ends_at,
          minutes_used,
          monthly_price_snapshot,
          price_per_minute_snapshot,
          total_minutes_snapshot,
          plans ( display_name )
        )
      `)
      .in("role", ["owner", "member"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    const rows = (data ?? []).map((u: any) => {
      const sub = u.subscriptions;
      return {
        userId: u.id,
        fullName: u.full_name,
        email: u.email,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        subscription: sub
          ? {
              id: sub.id,
              status: sub.status,
              planName: sub.plans?.display_name ?? "—",
              startedAt: sub.started_at,
              endsAt: sub.ends_at,
              minutesUsed: parseFloat(sub.minutes_used ?? "0"),
              totalMinutes: sub.total_minutes_snapshot,
              monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
              pricePerMinute: parseFloat(sub.price_per_minute_snapshot ?? "0"),
            }
          : null,
      };
    });

    return NextResponse.json(rows);
  } catch (err) {
    console.error("[GET /api/admin/billing]", err);
    return NextResponse.json({ error: "Failed to fetch billing data." }, { status: 500 });
  }
}