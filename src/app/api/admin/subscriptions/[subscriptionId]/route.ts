import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export async function PATCH(req: NextRequest, context: any) {
  try {
    const { subscriptionId } = await context.params;
    const supabase = createServerSupabaseClient();
    const { action } = await req.json();

    if (!["pause", "resume", "terminate"].includes(action)) {
      return NextResponse.json({ error: "Invalid action." }, { status: 400 });
    }

    const newStatus = action === "resume" ? "active" : "cancelled";
    const updatePayload: Record<string, unknown> = { status: newStatus };

    if (action === "terminate") {
      updatePayload.cancelled_at = new Date().toISOString();
      updatePayload.ends_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updatePayload)
      .eq("id", subscriptionId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("[PATCH /api/admin/subscriptions/[subscriptionId]]", err);
    return NextResponse.json({ error: "Failed to update subscription." }, { status: 500 });
  }
}