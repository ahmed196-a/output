import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/plans
 * Returns all active plans from the public.plans table.
 * Used by the pricing page to render plan cards dynamically.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    const { data: plans, error } = await supabase
      .from("plans")
      .select("id, name, display_name, monthly_price, total_minutes, price_per_minute, description")
      .eq("is_active", true)
      .order("monthly_price", { ascending: true });

    if (error) {
      console.error("[/api/plans] Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch plans." }, { status: 500 });
    }

    return NextResponse.json({ plans });
  } catch (err) {
    console.error("[/api/plans]", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
