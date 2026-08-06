import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { getRetellAgent } from "@/lib/retell-api";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ agentId: string }> }
) {
  try {
    const { agentId } = await context.params;
    const body = await req.json();
    const { messages, agent: clientAgent } = body;

    let systemPrompt = clientAgent?.general_prompt || clientAgent?.prompt || "";
    let agentName = clientAgent?.agent_name || clientAgent?.name || "AI Agent";
    let modelName = clientAgent?.response_engine?.model || clientAgent?.model || "gpt-4o-mini";

    // 1. Fetch agent details from DB or Retell AI if prompt is missing
    if (!systemPrompt && agentId) {
      try {
        const retellAgent = await getRetellAgent(agentId);
        if (retellAgent) {
          systemPrompt = retellAgent.general_prompt || "";
          agentName = retellAgent.agent_name || agentName;
        }
      } catch {
        // Fallback to Supabase DB lookup
        try {
          const supabase = createServerSupabaseClient();
          const { data: dbAgent } = await supabase
            .from("agents")
            .select("*")
            .or(`id.eq.${agentId},retell_agent_id.eq.${agentId}`)
            .single();
          if (dbAgent) {
            systemPrompt = dbAgent.general_prompt || dbAgent.prompt || "";
            agentName = dbAgent.agent_name || dbAgent.name || agentName;
          }
        } catch {
          // ignore lookup errors
        }
      }
    }

    const lastUserMessage = messages?.[messages.length - 1]?.content || "";

    // 2. Call OpenAI or LLM Chat Completions API if OPENAI_API_KEY is available
    const openAiKey = process.env.OPENAI_API_KEY?.trim();
    if (openAiKey) {
      const llmSystemMessage = {
        role: "system",
        content: `You are an interactive AI phone agent named "${agentName}". ${systemPrompt ? `Follow this prompt and instructions carefully: ${systemPrompt}` : "Respond naturally and concisely in 1 to 2 conversational sentences as if speaking on a phone call."}`
      };

      const conversationPayload = [
        llmSystemMessage,
        ...(Array.isArray(messages) ? messages.map((m: any) => ({
          role: m.role === "agent" || m.role === "assistant" ? "assistant" : "user",
          content: m.content || m.text || ""
        })) : [])
      ];

      const llmRes = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openAiKey}`
        },
        body: JSON.stringify({
          model: modelName.includes("gpt-4") ? "gpt-4o-mini" : "gpt-3.5-turbo",
          messages: conversationPayload,
          max_tokens: 150,
          temperature: 0.7
        })
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const replyContent = llmData.choices?.[0]?.message?.content?.trim();
        if (replyContent) {
          return NextResponse.json({ response: replyContent, role: "agent" });
        }
      }
    }

    // 3. Fallback Contextual Response Engine based on agent prompt & user input
    let generatedReply = "";
    const lowerInput = lastUserMessage.toLowerCase();

    if (lowerInput.includes("hello") || lowerInput.includes("hi") || lowerInput.includes("hey")) {
      generatedReply = `Hello! I'm ${agentName}. How can I help you today?`;
    } else if (lowerInput.includes("how are you")) {
      generatedReply = `I'm doing great! How can I assist you with your inquiry?`;
    } else if (lowerInput.includes("what are you doing") || lowerInput.includes("who are you")) {
      generatedReply = `I am ${agentName}, an AI voice assistant. ${systemPrompt ? `My instructions are: ${systemPrompt.slice(0, 120)}...` : "I can help answer your questions and assist with your calls."}`;
    } else if (lowerInput.includes("bye") || lowerInput.includes("goodbye")) {
      generatedReply = "Thank you for calling. Have a wonderful day!";
    } else {
      generatedReply = systemPrompt
        ? `I understand. Based on my configuration as ${agentName}, I am here to help. Could you tell me more details about what you need?`
        : `Got it. As ${agentName}, how can I help you further?`;
    }

    return NextResponse.json({ response: generatedReply, role: "agent" });
  } catch (error: any) {
    console.error("[POST /api/agents/[agentId]/chat Error]", error);
    return NextResponse.json(
      { response: "I'm sorry, I ran into an error processing that request. Please try again." },
      { status: 500 }
    );
  }
}
