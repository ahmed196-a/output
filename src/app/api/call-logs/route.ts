import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { verifyRequestJwt } from "@/lib/jwt-auth";

/**
 * GET /api/call-logs
 *
 * Returns CDR rows for the authenticated customer, filtered so that only
 * records whose start_datetime falls within at least one of the user's
 * subscription periods (active or previously purchased) are returned.
 *
 * Uses the service-role Supabase client so that RLS on the subscriptions
 * table does not block the query.
 */
export async function GET(req: NextRequest) {
  const jwt = await verifyRequestJwt(req);
  if (!jwt) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServerSupabaseClient(); // service-role key, bypasses RLS

  // ── 1. Resolve the assistant_id assigned to this user ─────────────────────
  const { data: assignmentRow, error: assignmentError } = await supabase
    .from("user_assistant_assignments")
    .select("assistant_id")
    .eq("user_id", jwt.sub)
    .maybeSingle();

  if (assignmentError) {
    console.error("[call-logs] assignment error:", assignmentError);
    return NextResponse.json({ error: "Failed to resolve assignment." }, { status: 500 });
  }

  if (!assignmentRow?.assistant_id) {
    // No assistant assigned → no calls to show
    return NextResponse.json([]);
  }

  const assignedAssistantId = assignmentRow.assistant_id;

  // ── 2. Fetch ALL subscription periods for this user ────────────────────────
  // We need both active and expired/cancelled subscriptions so the customer
  // can see any call that happened during a period they paid for.
  const { data: subRows, error: subError } = await supabase
    .from("subscriptions")
    .select("id, started_at, ends_at, status, price_per_minute_snapshot")
    .eq("user_id", jwt.sub)
    .order("started_at", { ascending: true });

  if (subError) {
    console.error("[call-logs] subscriptions error:", subError);
    return NextResponse.json({ error: "Failed to fetch subscriptions." }, { status: 500 });
  }

  const subscriptions = subRows ?? [];

  // If the user has never had a subscription, show nothing.
  if (subscriptions.length === 0) {
    return NextResponse.json([]);
  }

  // ── 3. Resolve price_per_minute from the active subscription ───────────────
  let pricePerMinute: number | null = null;

  const { data: userRow } = await supabase
    .from("users")
    .select("active_subscription_id")
    .eq("id", jwt.sub)
    .single();

  if (userRow?.active_subscription_id) {
    const activeSub = subscriptions.find((s: any) => s.id === userRow.active_subscription_id);
    if (activeSub) {
      pricePerMinute = Number((activeSub as any).price_per_minute_snapshot);
    }
  }

  // ── 4. Fetch all CDR rows for the assigned assistant ──────────────────────
  const { data: rows, error: cdrError } = await supabase
    .from("cdrs")
    .select("*")
    .eq("assistant_id", assignedAssistantId)
    .order("start_datetime", { ascending: true });

  if (cdrError) {
    console.error("[call-logs] CDR fetch error:", cdrError);
    return NextResponse.json({ error: "Failed to fetch call logs." }, { status: 500 });
  }

  // ── 5. Filter CDRs to those within a subscription period ──────────────────
  // Parse a CDR start_datetime value (ISO, Unix-ms, Unix-s, or DD/MM/YYYY) → ms epoch
  function parseCdrDate(raw: string | number | null | undefined): number | null {
    if (raw === null || raw === undefined || raw === "") return null;

    const ts = Number(raw);
    if (!isNaN(ts) && String(raw).trim() !== "") {
      // > 1e12 → milliseconds, otherwise seconds
      const ms = ts > 1e12 ? ts : ts * 1000;
      return isNaN(ms) ? null : ms;
    }

    if (typeof raw === "string") {
      // DD/MM/YYYY [HH:mm:ss]
      const ddmm = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[,\s]+(\d{1,2}:\d{2}(?::\d{2})?))?/);
      if (ddmm) {
        const [, dd, mm, yyyy, time] = ddmm;
        const iso = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}T${time ?? "00:00:00"}`;
        const d = new Date(iso).getTime();
        return isNaN(d) ? null : d;
      }
      // ISO or any other Date-parseable string
      const d = new Date(raw).getTime();
      return isNaN(d) ? null : d;
    }

    return null;
  }

  // Pre-compute subscription boundaries as epoch ms for fast comparison
  const subRanges = subscriptions
    .map((s: any) => {
      const start = s.started_at ? new Date(s.started_at).getTime() : null;
      const end   = s.ends_at    ? new Date(s.ends_at).getTime()    : null;
      return { start, end };
    })
    .filter((r) => r.start !== null && !isNaN(r.start!)) as Array<{
      start: number;
      end: number | null;
    }>;

  const filteredRows = (rows ?? []).filter((row: any) => {
    const callMs = parseCdrDate(row.start_datetime);
    if (callMs === null) return false;

    return subRanges.some(({ start, end }) => {
      const afterStart = callMs >= start;
      // If ends_at is null the subscription has no defined end → include all calls from start
      const beforeEnd  = end === null ? true : callMs <= end;
      return afterStart && beforeEnd;
    });
  });

  console.log(
    `[call-logs] user=${jwt.sub} | total CDRs: ${(rows ?? []).length} | after subscription filter: ${filteredRows.length}`
  );

  // ── 6. Shape & enrich the response ────────────────────────────────────────
  const result = filteredRows.map((row: any) => {
    const durationSeconds =
      row.total_seconds ?? Math.round(Number(row.total_mins ?? 0) * 60);
    const billableMinutes = durationSeconds > 0 ? Math.ceil(durationSeconds / 60) : 0;

    let computedCost: number | null = null;
    if (pricePerMinute !== null && durationSeconds > 0) {
      computedCost = Math.round(billableMinutes * pricePerMinute * 100) / 100;
    }

    return {
      id: row.id,
      callId: row.call_id ?? row.id,
      startedAt: row.start_datetime ?? "",
      endedAt: row.end_datetime ?? null,
      fromNumber: row.customer_number ?? "—",
      toNumber: row.assistant_id ?? "—",
      durationSeconds,
      status: row.is_successful === true ? "passed" : "failed",
      agentName: row.assistant_id ?? "Unknown",
      hasRecording: Boolean(row.call_recording),
      recordingUrl: row.call_recording ?? null,
      cost: computedCost,
      transcript: row.transcript ?? null,
      disconnectionReason: row.disconnection_reason ?? null,
      callInfo: row.call_info ?? null,
      customerSentiment: row.customer_sentiment ?? null,
      isSuccessful: row.is_successful ?? null,
    };
  });

  return NextResponse.json(result);
}
