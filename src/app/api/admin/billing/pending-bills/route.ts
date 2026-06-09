// src/app/api/admin/billing/pending-bills/route.ts
import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";

/**
 * GET /api/admin/billing/pending-bills
 *
 * Uses the SERVICE ROLE key (via createServerSupabaseClient) which bypasses
 * all RLS policies — so it can read every user's subscriptions freely.
 *
 * Works in two modes:
 *   A) If the pending_overage_invoices table exists  → upserts records, uses stored status
 *   B) If the table does NOT exist yet               → derives invoices on-the-fly from
 *      subscriptions data alone (no crash, still returns data)
 *
 * Overage rule: minutes_used > total_minutes_snapshot, for ANY subscription status
 * (active, expired, past_due).
 */
export async function GET() {
  // Always use service-role client — bypasses RLS entirely
  const supabase = createServerSupabaseClient();

  // ── 1. Fetch ALL subscriptions with overage potential ──────────────────────
  // Query subscriptions table directly using user_id (not via FK join)
  // so we get ALL subs including expired ones, not just active_subscription_id
  const { data: subs, error: subsError } = await supabase
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
      plan_id,
      plans ( display_name )
    `)
    .in("status", ["active", "expired", "past_due"])
    .order("ends_at", { ascending: false });

  if (subsError) {
    console.error("[pending-bills] subscriptions fetch error:", subsError);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions.", detail: subsError.message },
      { status: 500 }
    );
  }

  // ── 2. Keep only subscriptions where usage exceeds plan limit ──────────────
  const overageSubs = (subs ?? []).filter((sub: any) => {
    const used = Number(sub.minutes_used ?? 0);
    const total = Number(sub.total_minutes_snapshot ?? 0);
    return total > 0 && used > total;
  });

  if (overageSubs.length === 0) {
    return NextResponse.json({ pendingBills: [] });
  }

  // ── 3. Fetch user details for these subscriptions ─────────────────────────
  const userIds: string[] = [...new Set(overageSubs.map((s: any) => s.user_id as string))];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, full_name, email, role")
    .in("id", userIds);

  if (usersError) {
    console.error("[pending-bills] users fetch error:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users.", detail: usersError.message },
      { status: 500 }
    );
  }

  const usersMap: Record<string, any> = {};
  (users ?? []).forEach((u: any) => { usersMap[u.id] = u; });

  // ── 4. Try to load / upsert invoice records (graceful if table missing) ────
  const subIds = overageSubs.map((s: any) => s.id as string);
  const invoiceMap: Record<string, any> = {};
  let invoiceTableExists = true;

  try {
    const { data: existingInvoices, error: invFetchErr } = await supabase
      .from("pending_overage_invoices")
      .select("id, subscription_id, status, created_at, overage_minutes, overage_amount")
      .in("subscription_id", subIds);

    if (invFetchErr) {
      // Table likely doesn't exist — degrade gracefully
      console.warn("[pending-bills] invoice table unavailable:", invFetchErr.message);
      invoiceTableExists = false;
    } else {
      (existingInvoices ?? []).forEach((inv: any) => {
        invoiceMap[inv.subscription_id] = inv;
      });

      // Auto-create records for overages that have no invoice yet
      const toInsert = overageSubs
        .filter((sub: any) => !invoiceMap[sub.id])
        .map((sub: any) => {
          const used = Number(sub.minutes_used ?? 0);
          const total = Number(sub.total_minutes_snapshot ?? 0);
          const ppm = Number(sub.price_per_minute_snapshot ?? 0);
          const overageMin = Math.max(0, used - total);
          return {
            user_id: sub.user_id,
            subscription_id: sub.id,
            status: "pending",
            overage_minutes: overageMin,
            overage_amount: parseFloat((overageMin * ppm).toFixed(4)),
            price_per_minute: ppm,
            plan_name: sub.plans?.display_name ?? "—",
            period_start: sub.started_at,
            period_end: sub.ends_at,
          };
        });

      if (toInsert.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from("pending_overage_invoices")
          .insert(toInsert)
          .select("id, subscription_id, status, created_at");

        if (insertErr) {
          console.error("[pending-bills] auto-insert error:", insertErr.message);
          // Non-fatal — still return derived data
        } else {
          (inserted ?? []).forEach((inv: any) => {
            invoiceMap[inv.subscription_id] = inv;
          });
        }
      }
    }
  } catch (e: any) {
    console.warn("[pending-bills] invoice table check failed:", e?.message);
    invoiceTableExists = false;
  }

  // ── 5. Build final response ────────────────────────────────────────────────
  // If invoiceMap has a record, use its status for de-duplication (paid/dismissed = skip)
  // If no invoice table, always show as "pending" (no way to mark paid yet)
  const pendingBills = overageSubs
    .map((sub: any) => {
      const used = Number(sub.minutes_used ?? 0);
      const total = Number(sub.total_minutes_snapshot ?? 0);
      const ppm = Number(sub.price_per_minute_snapshot ?? 0);
      const overageMin = Math.max(0, used - total);
      const overageAmount = parseFloat((overageMin * ppm).toFixed(4));
      const user = usersMap[sub.user_id] ?? {};
      const existingInv = invoiceMap[sub.id];
      const invoiceStatus = existingInv?.status ?? "pending";

      return {
        invoiceId: existingInv?.id ?? `tmp-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionStatus: sub.status as string,
        userId: sub.user_id as string,
        userName: user.full_name ?? "—",
        userEmail: user.email ?? "—",
        userRole: user.role ?? "—",
        planName: (sub.plans as any)?.display_name ?? "—",
        invoiceStatus,
        periodStart: sub.started_at as string,
        periodEnd: sub.ends_at as string | null,
        allocatedMinutes: total,
        usedMinutes: used,
        overageMinutes: overageMin,
        pricePerMinute: ppm,
        overageAmount,
        monthlyPrice: Number(sub.monthly_price_snapshot ?? 0),
        generatedAt: existingInv?.created_at ?? new Date().toISOString(),
        invoiceTableExists,
      };
    })
    .filter((bill) => bill.invoiceStatus === "pending");

  return NextResponse.json({ pendingBills });
}