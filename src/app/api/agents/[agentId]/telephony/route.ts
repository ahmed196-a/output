import { NextRequest, NextResponse } from "next/server";
import { listRetellPhoneNumbers, updateRetellPhoneNumber } from "@/lib/retell-api";
import { verifyRequestJwt } from "@/lib/jwt-auth";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getPurchasedNumbers, isTelnyxConfigured } from "@/lib/telnyx-api";

async function getFallbackUserId(): Promise<string | null> {
  try {
    const supabase = createServerSupabaseClient();
    const { data: users } = await supabase.from('users').select('id').limit(1);
    if (users && users.length > 0) {
      return users[0].id;
    }
  } catch (e) {}
  return null;
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;

    const payload = await verifyRequestJwt(req);
    let userId = payload?.sub || null;
    const fallbackUserId = await getFallbackUserId();

    if (!userId) {
      userId = fallbackUserId;
    }

    // 1. Fetch live Retell phone numbers map to know which agents are attached to which phone numbers
    const retellNumberMap = new Map<string, any>();
    try {
      const liveRetellNumbers = await listRetellPhoneNumbers({ skipCache: true });
      (liveRetellNumbers || []).forEach((p: any) => {
        if (p.phone_number) {
          retellNumberMap.set(p.phone_number, p);
        }
      });
    } catch (e) {
      console.warn("[Telephony Retell Map Warning]", e);
    }

    // 2. Collect numbers specifically owned / ordered by this user
    const userTelnyxNumbersMap = new Map<string, any>();

    // A. Query Supabase `phone_numbers` table
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase.from("phone_numbers").select("*").order("created_at", { ascending: false });

      if (userId && fallbackUserId && userId !== fallbackUserId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${fallbackUserId}`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: dbNumbers } = await query;
      if (dbNumbers && dbNumbers.length > 0) {
        dbNumbers.forEach((n: any) => {
          const status = (n.status || "").toLowerCase();
          if (n.phone_number && status !== "cancelled" && status !== "failed" && status !== "failure") {
            userTelnyxNumbersMap.set(n.phone_number, {
              phoneNumber: n.phone_number,
              countryCode: n.country_code || "US",
              type: n.type || "local",
              nickname: n.nickname || (n.country_code ? `${n.country_code} Line` : "My Phone Line"),
              dbAgentId: n.retell_agent_id,
            });
          }
        });
      }
    } catch (dbErr) {
      console.warn("[Telephony DB Query Warning]", dbErr);
    }

    // B. Query Supabase `phone_orders` table (numbers purchased by this user with status success)
    try {
      const supabase = createServerSupabaseClient();
      let query = supabase.from("phone_orders").select("*").order("created_at", { ascending: false });

      if (userId && fallbackUserId && userId !== fallbackUserId) {
        query = query.or(`user_id.eq.${userId},user_id.eq.${fallbackUserId}`);
      } else if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data: dbOrders } = await query;
      if (dbOrders && dbOrders.length > 0) {
        dbOrders.forEach((o: any) => {
          const status = (o.status || "").toLowerCase();
          const isSuccessOrActive = status === "success" || status === "completed" || status === "active";
          if (o.phone_number && !userTelnyxNumbersMap.has(o.phone_number) && isSuccessOrActive) {
            userTelnyxNumbersMap.set(o.phone_number, {
              phoneNumber: o.phone_number,
              countryCode: o.phone_number.startsWith('+44') ? 'GB' : 'US',
              type: 'local',
              nickname: `CallAutomate Purchased Line`,
              dbAgentId: null,
            });
          }
        });
      }
    } catch (orderErr) {
      console.warn("[Telephony Orders Query Warning]", orderErr);
    }

    // C. Fallback: If DB user numbers is empty AND voice API is configured, fetch account numbers from voice API
    if (userTelnyxNumbersMap.size === 0 && isTelnyxConfigured()) {
      try {
        const liveTelnyxNumbers = await getPurchasedNumbers();
        (liveTelnyxNumbers || []).forEach((t: any) => {
          if (t.phoneNumber && !userTelnyxNumbersMap.has(t.phoneNumber)) {
            userTelnyxNumbersMap.set(t.phoneNumber, {
              phoneNumber: t.phoneNumber,
              countryCode: t.countryCode || "US",
              type: t.type || "local",
              nickname: `${t.countryCode || "US"} CallAutomate Line`,
              dbAgentId: t.agentId,
            });
          }
        });
      } catch (telnyxErr) {
        console.warn("[Telephony Telnyx API Fetch Warning]", telnyxErr);
      }
    }

    // 3. Format only user's Telnyx numbers with Retell live attachment info
    const userNumbers = Array.from(userTelnyxNumbersMap.values()).map((item: any) => {
      const retellInfo = retellNumberMap.get(item.phoneNumber);
      const inboundAgents = retellInfo?.inbound_agents || [];
      const outboundAgents = retellInfo?.outbound_agents || [];
      const inboundAgentId = retellInfo?.inbound_agent_id || item.dbAgentId;
      const outboundAgentId = retellInfo?.outbound_agent_id || item.dbAgentId;

      return {
        phone_number: item.phoneNumber,
        phone_number_pretty: item.phoneNumber,
        nickname: item.nickname,
        inbound_agents: inboundAgents.length > 0 ? inboundAgents : (inboundAgentId ? [{ agent_id: inboundAgentId, weight: 1 }] : []),
        outbound_agents: outboundAgents.length > 0 ? outboundAgents : (outboundAgentId ? [{ agent_id: outboundAgentId, weight: 1 }] : []),
        inbound_agent_id: inboundAgentId || undefined,
        outbound_agent_id: outboundAgentId || undefined,
      };
    });

    // 4. Filter attached numbers for this agent
    const attachedNumbers = userNumbers.filter((n) => {
      const hasInbound = n.inbound_agents?.some((a: any) => a.agent_id === agentId) || n.inbound_agent_id === agentId;
      const hasOutbound = n.outbound_agents?.some((a: any) => a.agent_id === agentId) || n.outbound_agent_id === agentId;
      return hasInbound || hasOutbound;
    });

    return NextResponse.json({
      agent_id: agentId,
      attached_numbers: attachedNumbers,
      all_numbers: userNumbers,
    });
  } catch (error: any) {
    console.error("[GET /api/agents/[agentId]/telephony]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch user telephony config" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { phone_number, action } = body;

    if (!phone_number) {
      return NextResponse.json(
        { error: "phone_number is required to attach or detach from agent" },
        { status: 400 }
      );
    }

    let targetRetellAgentId: string | null = null;
    if (action !== "detach") {
      try {
        const supabase = createServerSupabaseClient();
        const { data: dbAgent } = await supabase
          .from("agents")
          .select("retell_agent_id")
          .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
          .maybeSingle();

        targetRetellAgentId = dbAgent?.retell_agent_id || agentId;
      } catch (e) {
        targetRetellAgentId = agentId;
      }
    }

    let retellResult;
    if (action === "detach") {
      retellResult = await updateRetellPhoneNumber(phone_number, {
        inbound_agents: [],
        outbound_agents: [],
      });
    } else {
      retellResult = await updateRetellPhoneNumber(phone_number, {
        inbound_agents: [{ agent_id: targetRetellAgentId || agentId, weight: 1 }],
        outbound_agents: [{ agent_id: targetRetellAgentId || agentId, weight: 1 }],
      });
    }

    // Sync snapshot to local DB
    try {
      const supabase = createServerSupabaseClient();
      await supabase
        .from("phone_numbers")
        .update({
          retell_agent_id: action === "detach" ? null : (targetRetellAgentId || agentId),
          updated_at: new Date().toISOString(),
        })
        .eq("phone_number", phone_number);
    } catch (e) {
      console.warn("[Telephony PATCH DB Update Warning]", e);
    }

    // Re-run GET handler logic to return fresh user numbers list
    const fakeReq = new NextRequest(req.url, { headers: req.headers });
    const freshRes = await GET(fakeReq, { params: Promise.resolve({ agentId }) });
    const freshData = await freshRes.json();

    return NextResponse.json({
      success: true,
      section: "telephony",
      data: {
        phone_number,
        action: action || "attach",
        retellResult,
        all_numbers: freshData.all_numbers || [],
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/telephony]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update phone number attachment" },
      { status: error.status || 500 }
    );
  }
}
