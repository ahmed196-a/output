// src/app/api/billing/pending-bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

/**
 * GET /api/billing/pending-bills
 *
 * Returns pending overage invoices for the authenticated user.
 *
 * An overage invoice is generated whenever minutes_used > total_minutes_snapshot,
 * regardless of whether the subscription is still active or already expired.
 *
 * If the subscription is ACTIVE and over-limit → "active_overage" warning shown.
 * If the subscription is EXPIRED and over-limit → "pending" invoice shown.
 *
 * De-duplication: if a record already exists in pending_overage_invoices for
 * that subscription_id, we use its stored status (pending / paid / dismissed)
 * so a settled invoice never reappears.
 *
 * Auto-upsert: if no invoice record exists yet and overage is detected, we
 * insert one automatically so it persists across page loads.
 */
export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();

  // ── 1. Fetch ALL subscriptions for this user (active + expired) ──────────
  const { data: subs, error } = await supabase
    .from("subscriptions")
    .select(`
      id,
      status,
      started_at,
      ends_at,
      minutes_used,
      monthly_price_snapshot,
      price_per_minute_snapshot,
      total_minutes_snapshot,
      plans ( display_name )
    `)
    .eq("user_id", payload.sub)
    .in("status", ["active", "expired", "past_due"])
    .order("ends_at", { ascending: false });

  if (error) {
    console.error("[GET /api/billing/pending-bills]", error);
    return NextResponse.json({ error: "Failed to fetch pending bills." }, { status: 500 });
  }

  // ── 2. Filter to only subscriptions that are actually over the limit ──────
  const overageSubs = (subs ?? []).filter((sub: any) => {
    const used = parseFloat(sub.minutes_used ?? "0");
    const total = parseFloat(sub.total_minutes_snapshot ?? "0");
    return total > 0 && used > total;
  });

  if (overageSubs.length === 0) {
    return NextResponse.json({ pendingBills: [] });
  }

  // ── 3. Load any existing invoice records for these subscriptions ──────────
  const subIds = overageSubs.map((s: any) => s.id);

  const { data: existingInvoices } = await supabase
    .from("pending_overage_invoices")
    .select("*")
    .eq("user_id", payload.sub)
    .in("subscription_id", subIds);

  const invoiceMap: Record<string, any> = {};
  (existingInvoices ?? []).forEach((inv: any) => {
    invoiceMap[inv.subscription_id] = inv;
  });

  // ── 4. Auto-upsert: create invoice records for any overage not yet recorded ─
  const toInsert = overageSubs
    .filter((sub: any) => !invoiceMap[sub.id])
    .map((sub: any) => {
      const used = parseFloat(sub.minutes_used ?? "0");
      const total = parseFloat(sub.total_minutes_snapshot ?? "0");
      const pricePerMinute = parseFloat(sub.price_per_minute_snapshot ?? "0");
      const overageMinutes = Math.max(0, used - total);
      return {
        user_id: payload.sub,
        subscription_id: sub.id,
        status: "pending",
        overage_minutes: overageMinutes,
        overage_amount: overageMinutes * pricePerMinute,
        price_per_minute: pricePerMinute,
        plan_name: sub.plans?.display_name ?? "—",
        period_start: sub.started_at,
        period_end: sub.ends_at,
      };
    });

  if (toInsert.length > 0) {
    const { data: inserted, error: insertErr } = await supabase
      .from("pending_overage_invoices")
      .insert(toInsert)
      .select();

    if (insertErr) {
      console.error("[pending-bills] auto-insert error:", insertErr);
    } else {
      // Merge newly inserted records into the map
      (inserted ?? []).forEach((inv: any) => {
        invoiceMap[inv.subscription_id] = inv;
      });
    }
  }

  // ── 5. Build response — skip paid/dismissed invoices ─────────────────────
  const pendingBills = overageSubs
    .map((sub: any) => {
      const used = parseFloat(sub.minutes_used ?? "0");
      const total = parseFloat(sub.total_minutes_snapshot ?? "0");
      const pricePerMinute = parseFloat(sub.price_per_minute_snapshot ?? "0");
      const overageMinutes = Math.max(0, used - total);
      const overageAmount = overageMinutes * pricePerMinute;
      const existingInv = invoiceMap[sub.id];

      return {
        invoiceId: existingInv?.id ?? `overage-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionStatus: sub.status, // "active" | "expired" | "past_due"
        planName: sub.plans?.display_name ?? "—",
        invoiceStatus: existingInv?.status ?? "pending",
        periodStart: sub.started_at,
        periodEnd: sub.ends_at,
        allocatedMinutes: total,
        usedMinutes: used,
        overageMinutes,
        pricePerMinute,
        overageAmount,
        monthlyPrice: parseFloat(sub.monthly_price_snapshot ?? "0"),
        generatedAt: existingInv?.created_at ?? new Date().toISOString(),
      };
    })
    .filter((bill) => bill.invoiceStatus === "pending");

  return NextResponse.json({ pendingBills });
}