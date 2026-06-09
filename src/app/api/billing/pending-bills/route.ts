// src/app/api/billing/pending-bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

export async function GET(req: NextRequest) {
  const payload = await verifyRequestJwt(req);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServerSupabaseClient();
  const userId = payload.sub;

  // ── 1. Fetch ACTIVE subscriptions only ────────────────────────────────────
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
      plans ( display_name )
    `)
    .eq("user_id", userId)
    .eq("status", "active")
    .order("ends_at", { ascending: false });

  if (subsError) {
    console.error("[customer pending-bills] subscriptions fetch error:", subsError);
    return NextResponse.json(
      { error: "Failed to fetch subscriptions.", detail: subsError.message },
      { status: 500 }
    );
  }

  // ── 2. Keep only over-limit subscriptions ─────────────────────────────────
  const overageSubs = (subs ?? []).filter((sub: any) => {
    const used = Number(sub.minutes_used ?? 0);
    const total = Number(sub.total_minutes_snapshot ?? 0);
    return total > 0 && used > total;
  });

  if (overageSubs.length === 0) {
    return NextResponse.json({ pendingBills: [] });
  }

  // ── 3. Load existing invoices then upsert (update if exists, insert if not) 
  const subIds = overageSubs.map((s: any) => s.id as string);
  const invoiceMap: Record<string, any> = {};

  const { data: existingInvoices, error: invFetchErr } = await supabase
    .from("pending_overage_invoices")
    .select("id, subscription_id, status, created_at")
    .eq("user_id", userId)
    .in("subscription_id", subIds);

  if (invFetchErr) {
    console.warn("[customer pending-bills] invoice table unavailable:", invFetchErr.message);
  } else {
    (existingInvoices ?? []).forEach((inv: any) => {
      invoiceMap[inv.subscription_id] = inv;
    });

    for (const sub of overageSubs) {
      const used = Number(sub.minutes_used ?? 0);
      const total = Number(sub.total_minutes_snapshot ?? 0);
      const ppm = Number(sub.price_per_minute_snapshot ?? 0);
      const overageMin = Math.max(0, used - total);
      const overageAmount = parseFloat((overageMin * ppm).toFixed(4));
      const existing = invoiceMap[sub.id];

      if (existing) {
        // Update overage amount to reflect current usage
        const { error: updateErr } = await supabase
          .from("pending_overage_invoices")
          .update({ overage_minutes: overageMin, overage_amount: overageAmount })
          .eq("id", existing.id)
          .eq("status", "pending"); // only update if still pending
        if (updateErr) console.error("[customer pending-bills] update error:", updateErr.message);
      } else {
        // Insert new invoice
        const { data: inserted, error: insertErr } = await supabase
          .from("pending_overage_invoices")
          .insert({
            user_id: userId,
            subscription_id: sub.id,
            status: "pending",
            overage_minutes: overageMin,
            overage_amount: overageAmount,
            price_per_minute: ppm,
            plan_name: (sub.plans as any)?.display_name ?? "—",
            period_start: sub.started_at,
            period_end: sub.ends_at,
          })
          .select("id, subscription_id, status, created_at")
          .single();
        if (insertErr) {
          console.error("[customer pending-bills] insert error:", insertErr.message);
        } else if (inserted) {
          invoiceMap[inserted.subscription_id] = inserted;
        }
      }
    }
  }

  // ── 4. Build response ──────────────────────────────────────────────────────
  const pendingBills = overageSubs
    .map((sub: any) => {
      const used = Number(sub.minutes_used ?? 0);
      const total = Number(sub.total_minutes_snapshot ?? 0);
      const ppm = Number(sub.price_per_minute_snapshot ?? 0);
      const overageMin = Math.max(0, used - total);
      const overageAmount = parseFloat((overageMin * ppm).toFixed(4));
      const existingInv = invoiceMap[sub.id];
      const invoiceStatus = existingInv?.status ?? "pending";

      return {
        invoiceId: existingInv?.id ?? `tmp-${sub.id}`,
        subscriptionId: sub.id,
        subscriptionStatus: sub.status as string,
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
      };
    })
    .filter((bill) => bill.invoiceStatus === "pending");

  return NextResponse.json({ pendingBills });
}