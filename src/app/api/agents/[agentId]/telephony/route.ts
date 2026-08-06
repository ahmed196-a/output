import { NextRequest, NextResponse } from "next/server";
import { listRetellPhoneNumbers, updateRetellPhoneNumber } from "@/lib/retell-api";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const allNumbers = await listRetellPhoneNumbers({ skipCache: true });

    // Filter numbers attached to this agent
    const attachedNumbers = allNumbers.filter((n) => {
      const hasInbound = n.inbound_agents?.some((a) => a.agent_id === agentId) || n.inbound_agent_id === agentId;
      const hasOutbound = n.outbound_agents?.some((a) => a.agent_id === agentId) || n.outbound_agent_id === agentId;
      return hasInbound || hasOutbound;
    });

    return NextResponse.json({
      agent_id: agentId,
      attached_numbers: attachedNumbers,
      all_numbers: allNumbers,
    });
  } catch (error: any) {
    console.error("[GET /api/agents/[agentId]/telephony]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch telephony config from Retell AI" },
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

    let retellResult;
    if (action === "detach") {
      // Detach agent from phone number
      retellResult = await updateRetellPhoneNumber(phone_number, {
        inbound_agents: [],
        outbound_agents: [],
      });
    } else {
      // Attach agent to phone number for both inbound and outbound with weight 1
      retellResult = await updateRetellPhoneNumber(phone_number, {
        inbound_agents: [{ agent_id: agentId, weight: 1 }],
        outbound_agents: [{ agent_id: agentId, weight: 1 }],
      });
    }

    const freshNumbers = await listRetellPhoneNumbers({ skipCache: true });

    return NextResponse.json({
      success: true,
      section: "telephony",
      data: {
        phone_number,
        action: action || "attach",
        retellResult,
        all_numbers: freshNumbers,
      },
    });
  } catch (error: any) {
    console.error("[PATCH /api/agents/[agentId]/telephony]", error);
    return NextResponse.json(
      { error: error.message || "Failed to update phone number attachment on Retell AI" },
      { status: error.status || 500 }
    );
  }
}
