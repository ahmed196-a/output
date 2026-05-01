import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { createHmac } from "crypto";

/**
 * POST /api/webhooks/retell
 *
 * Receives call events from Retell AI and persists them to public.call_logs.
 * Supported event types: call_started, call_ended, call_analyzed
 *
 * Retell signs each request with HMAC-SHA256; we verify the signature.
 * Set RETELL_WEBHOOK_SECRET in your environment (from the Retell dashboard).
 */

const WEBHOOK_SECRET = process.env.RETELL_WEBHOOK_SECRET ?? "";

function verifyRetellSignature(body: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn("[retell-webhook] RETELL_WEBHOOK_SECRET not set – skipping verification");
    return true; // allow in dev without secret
  }
  const expected = createHmac("sha256", WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  return signature === expected;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-retell-signature") ?? "";

  if (!verifyRetellSignature(rawBody, signature)) {
    console.warn("[retell-webhook] Invalid signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const event = payload.event as string;
  const call = payload.data as Record<string, unknown> ?? {};
  const retellCallId = call.call_id as string;
  const retellAgentId = call.agent_id as string;

  if (!retellCallId || !retellAgentId) {
    return NextResponse.json({ error: "Missing call_id or agent_id." }, { status: 400 });
  }

  const supabase = createServerSupabaseClient();

  // Resolve our internal agent UUID from the Retell agent ID
  const { data: agentRow } = await supabase
    .from("agents")
    .select("id")
    .eq("retell_agent_id", retellAgentId)
    .single();

  const agentUuid = agentRow?.id ?? null;

  // Build the upsert payload based on event type
  const baseData = {
    retell_call_id: retellCallId,
    retell_agent_id: retellAgentId,
    agent_id: agentUuid,
    raw_payload: payload,
  };

  let eventData: Record<string, unknown> = {};

  switch (event) {
    case "call_started":
      eventData = {
        call_status: "ongoing",
        start_timestamp: call.start_timestamp ?? Date.now(),
        from_number: call.from_number ?? null,
        to_number: call.to_number ?? null,
      };
      break;

    case "call_ended":
      eventData = {
        call_status: call.call_status ?? "ended",
        start_timestamp: call.start_timestamp ?? null,
        end_timestamp: call.end_timestamp ?? null,
        from_number: call.from_number ?? null,
        to_number: call.to_number ?? null,
        transcript: call.transcript ?? null,
        transcript_object: call.transcript_object ?? null,
        recording_url: call.recording_url ?? null,
        disconnection_reason: call.disconnection_reason ?? null,
        call_cost: call.call_cost
          ? (call.call_cost as Record<string, unknown>).total_cost ?? null
          : null,
      };
      break;

    case "call_analyzed":
      eventData = {
        call_analysis: call.call_analysis ?? null,
        call_status: "ended",
      };
      break;

    default:
      // Unknown event — still store the raw payload for auditing
      console.log(`[retell-webhook] Unknown event type: ${event}`);
      eventData = { call_status: "unknown" };
  }

  const { error } = await supabase
    .from("call_logs")
    .upsert(
      { ...baseData, ...eventData },
      { onConflict: "retell_call_id" }
    );

  if (error) {
    console.error("[retell-webhook] DB upsert error:", error);
    return NextResponse.json({ error: "Database error." }, { status: 500 });
  }

  console.log(`[retell-webhook] Processed ${event} for call ${retellCallId}`);
  return NextResponse.json({ received: true });
}
