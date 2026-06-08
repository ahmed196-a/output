// src/app/api/admin/billing/pending-bills/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/admin/billing/pending-bills
 *
 * Returns all pending overage invoices across all users. Admin-only.
 *
 * Detects overage on BOTH active and expired subscriptions.
 * Auto-upserts invoice records into pending_overage_invoices so they persist.
 * Skips invoices already marked paid or dismissed.
 */
export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // ── 1. All active + expired subscriptions across all users ───────────────
    const { data: subs, error } = await supabase
      .from("subscriptions")
      .select(`
        id,
        user_id,
        status,
        started_at,
        ends_at,
        minutes_used,
        monthly_price_snapshot,
        price_per_minute_snapshot,
        total_minutes_snapshot,
        plans ( display_name )
      `)
      .in("status", ["active", "expired", "past_due"])
      .order("ends_at", { ascending: false });

    if (error) throw error;

    // ── 2. Keep only over-limit subscriptions ─────────────────────────────────
    const overageSubs = (subs ?? []).filter((sub: any) => {
      const used = parseFloat(sub.minutes_used ?? "0");
      const total = parseFloat(sub.total_minutes_snapshot ?? "0");
      return total > 0 && used > total;
    });

    if (overageSubs.length === 0) {
      return NextResponse.json({ pendingBills: [] });
    }

    // ── 3. Fetch user info ────────────────────────────────────────────────────
    const userIds = [...new Set(overageSubs.map((s: any) => s.user_id))];
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, full_name, email, role")
      .in("id", userIds);

    if (usersError) throw usersError;

    const usersMap: Record<string, any> = {};
    (users ?? []).forEach((u: any) => { usersMap[u.id] = u; });

    // ── 4. Load existing invoice records ─────────────────────────────────────
    const subIds = overageSubs.map((s: any) => s.id);
    const { data: existingInvoices } = await supabase
      .from("pending_overage_invoices")
      .select("*")
      .in("subscription_id", subIds);

    const invoiceMap: Record<string, any> = {};
    (existingInvoices ?? []).forEach((inv: any) => {
      invoiceMap[inv.subscription_id] = inv;
    });

    // ── 5. Auto-upsert: create missing invoice records ────────────────────────
    const toInsert = overageSubs
      .filter((sub: any) => !invoiceMap[sub.id])
      .map((sub: any) => {
        const used = parseFloat(sub.minutes_used ?? "0");
        const total = parseFloat(sub.total_minutes_snapshot ?? "0");
        const pricePerMinute = parseFloat(sub.price_per_minute_snapshot ?? "0");
        const overageMinutes = Math.max(0, used - total);
        return {
          user_id: sub.user_id,
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
        console.error("[admin pending-bills] auto-insert error:", insertErr);
      } else {
        (inserted ?? []).forEach((inv: any) => {
          invoiceMap[inv.subscription_id] = inv;
        });
      }
    }

    // ── 6. Build response — skip paid/dismissed ───────────────────────────────
    const pendingBills = overageSubs
      .map((sub: any) => {
        const used = parseFloat(sub.minutes_used ?? "0");
        const total = parseFloat(sub.total_minutes_snapshot ?? "0");
        const pricePerMinute = parseFloat(sub.price_per_minute_snapshot ?? "0");
        const overageMinutes = Math.max(0, used - total);
        const overageAmount = overageMinutes * pricePerMinute;
        const user = usersMap[sub.user_id] ?? {};
        const existingInv = invoiceMap[sub.id];

        return {
          invoiceId: existingInv?.id ?? `overage-${sub.id}`,
          subscriptionId: sub.id,
          subscriptionStatus: sub.status,
          userId: sub.user_id,
          userName: user.full_name ?? "—",
          userEmail: user.email ?? "—",
          userRole: user.role ?? "—",
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
  } catch (err) {
    console.error("[GET /api/admin/billing/pending-bills]", err);
    return NextResponse.json({ error: "Failed to fetch pending bills." }, { status: 500 });
  }
}