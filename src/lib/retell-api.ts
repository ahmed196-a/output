/**
 * Server-only helper for calling the Retell AI REST API.
 * Never import this in client components.
 *
 * Base URL: https://api.retellai.com
 * Docs:     https://docs.retellai.com
 */

const RETELL_BASE = "https://api.retellai.com";

export function isRetellConfigured(): boolean {
  return !!process.env.RETELL_API_KEY?.trim();
}

function getRetellKey(): string {
  return process.env.RETELL_API_KEY?.trim() || "";
}

async function retellFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!isRetellConfigured()) {
    throw new Error("RETELL_API_KEY env var is not set.");
  }

  const res = await fetch(`${RETELL_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getRetellKey()}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Retell API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

// ─── Voices ───────────────────────────────────────────────────────────────────

export type RetellVoice = {
  voice_id: string;
  voice_name: string;
  provider: string;
  accent?: string;
  gender?: string;
  preview_audio_url?: string;
};

const MOCK_VOICES: RetellVoice[] = [
  { voice_id: "retell-Cimo", voice_name: "Cimo (Friendly US Male)", provider: "elevenlabs", accent: "american", gender: "male" },
  { voice_id: "retell-Sarah", voice_name: "Sarah (Professional US Female)", provider: "elevenlabs", accent: "american", gender: "female" },
  { voice_id: "retell-James", voice_name: "James (UK Executive)", provider: "elevenlabs", accent: "british", gender: "male" },
  { voice_id: "retell-Elena", voice_name: "Elena (Warm Support)", provider: "elevenlabs", accent: "american", gender: "female" },
];

export async function listRetellVoices(): Promise<RetellVoice[]> {
  if (!isRetellConfigured()) return MOCK_VOICES;
  try {
    return await retellFetch<RetellVoice[]>("/list-voices");
  } catch (e) {
    return MOCK_VOICES;
  }
}

// ─── LLM ──────────────────────────────────────────────────────────────────────

export type RetellLlmResponse = {
  llm_id: string;
  general_prompt?: string;
  begin_message?: string;
  model?: string;
  [key: string]: unknown;
};

let MOCK_LLMS: RetellLlmResponse[] = [
  {
    llm_id: "llm_default_support_01",
    model: "gpt-4o",
    general_prompt: "You are a customer service AI representative handling incoming support calls.",
    begin_message: "Hello! Thanks for calling CallAutomate. How can I help you today?",
  },
];

export async function listRetellLlms(): Promise<RetellLlmResponse[]> {
  if (!isRetellConfigured()) return MOCK_LLMS;
  try {
    return await retellFetch<RetellLlmResponse[]>("/list-retell-llms");
  } catch (e) {
    return MOCK_LLMS;
  }
}

export async function createRetellLlm(opts: {
  general_prompt?: string;
  begin_message?: string;
  model?: string;
}): Promise<RetellLlmResponse> {
  if (!isRetellConfigured()) {
    const mockLlm: RetellLlmResponse = {
      llm_id: `llm_${Math.random().toString(36).substring(2, 10)}`,
      model: opts.model || "gpt-4o",
      general_prompt: opts.general_prompt || "You are a helpful AI assistant.",
      begin_message: opts.begin_message || "Hello! How can I help you today?",
    };
    MOCK_LLMS.unshift(mockLlm);
    return mockLlm;
  }

  const body: Record<string, unknown> = {};
  if (opts.general_prompt?.trim()) body.general_prompt = opts.general_prompt.trim();
  if (opts.begin_message?.trim()) body.begin_message = opts.begin_message.trim();
  if (opts.model?.trim()) body.model = opts.model.trim();

  return retellFetch<RetellLlmResponse>("/create-retell-llm", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ─── Agent ────────────────────────────────────────────────────────────────────

export type RetellAgentResponse = {
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  response_engine: { type: string; llm_id?: string; llm_websocket_url?: string };
  begin_message?: string;
  general_prompt?: string;
  created_at?: number;
  userId?: string;
  [key: string]: unknown;
};

export type RetellCreateAgentBody = {
  response_engine: { type: string; llm_id?: string; llm_websocket_url?: string };
  voice_id: string;
  agent_name?: string;
  language?: string;
  begin_message?: string;
  general_prompt?: string;
  [key: string]: unknown;
};

let MOCK_AGENTS: RetellAgentResponse[] = [];

export async function createRetellAgent(body: RetellCreateAgentBody, userId?: string): Promise<RetellAgentResponse> {
  let created: RetellAgentResponse;

  if (!isRetellConfigured()) {
    created = {
      agent_id: `agent_${Math.random().toString(36).substring(2, 10)}`,
      agent_name: body.agent_name || "New Voice Agent",
      voice_id: body.voice_id,
      language: body.language || "en-US",
      response_engine: body.response_engine,
      begin_message: body.begin_message || "Hello! How can I assist you?",
      general_prompt: body.general_prompt || "You are an AI phone assistant.",
      created_at: Date.now(),
      userId,
    };
  } else {
    created = await retellFetch<RetellAgentResponse>("/create-agent", {
      method: "POST",
      body: JSON.stringify(body),
    });
    if (userId) created.userId = userId;
  }

  MOCK_AGENTS.unshift(created);
  return created;
}

export async function getRetellAgent(agentId: string): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    const found = MOCK_AGENTS.find((a) => a.agent_id === agentId);
    if (found) return found;
    return MOCK_AGENTS[0] || {
      agent_id: agentId,
      agent_name: "Voice Agent",
      voice_id: "retell-Cimo",
      language: "en-US",
      response_engine: { type: "retell-llm" },
    };
  }
  return retellFetch<RetellAgentResponse>(`/get-agent/${agentId}`);
}

export async function updateRetellAgent(
  agentId: string,
  body: Partial<RetellCreateAgentBody>
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    const agent = MOCK_AGENTS.find((a) => a.agent_id === agentId);
    if (agent) {
      if (body.agent_name) agent.agent_name = body.agent_name;
      if (body.voice_id) agent.voice_id = body.voice_id;
      if (body.begin_message) agent.begin_message = body.begin_message;
      if (body.general_prompt) agent.general_prompt = body.general_prompt;
      return agent;
    }
  }

  return retellFetch<RetellAgentResponse>(`/update-agent/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteRetellAgent(agentId: string): Promise<void> {
  if (!isRetellConfigured()) {
    MOCK_AGENTS = MOCK_AGENTS.filter((a) => a.agent_id !== agentId);
    return;
  }
  await retellFetch<void>(`/delete-agent/${agentId}`, { method: "DELETE" });
}

export async function listRetellAgents(userId?: string): Promise<RetellAgentResponse[]> {
  if (!isRetellConfigured()) {
    if (userId) {
      return MOCK_AGENTS.filter((a) => a.userId === userId || !a.userId);
    }
    return MOCK_AGENTS;
  }
  try {
    const fetched = await retellFetch<RetellAgentResponse[]>("/list-agents");
    const inMemoryUserAgents = userId ? MOCK_AGENTS.filter((a) => a.userId === userId) : MOCK_AGENTS;

    const agentMap = new Map<string, RetellAgentResponse>();
    (Array.isArray(fetched) ? fetched : []).forEach((a) => agentMap.set(a.agent_id, a));
    inMemoryUserAgents.forEach((a) => {
      if (!agentMap.has(a.agent_id)) {
        agentMap.set(a.agent_id, a);
      }
    });

    return Array.from(agentMap.values());
  } catch (e) {
    if (userId) {
      return MOCK_AGENTS.filter((a) => a.userId === userId || !a.userId);
    }
    return MOCK_AGENTS;
  }
}

// ─── Number Association & Web Calls ──────────────────────────────────────────

export async function associatePhoneNumberWithAgent(phoneNumber: string, agentId: string): Promise<any> {
  if (!isRetellConfigured()) {
    return { success: true, phone_number: phoneNumber, agent_id: agentId, mock: true };
  }

  return retellFetch<any>("/import-phone-number", {
    method: "POST",
    body: JSON.stringify({
      phone_number: phoneNumber,
      agent_id: agentId,
    }),
  });
}

export async function createRetellWebCall(agentId: string): Promise<{ access_token: string; call_id: string }> {
  if (!isRetellConfigured()) {
    return {
      access_token: `mock_webcall_token_${Date.now()}`,
      call_id: `call_mock_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  return retellFetch<{ access_token: string; call_id: string }>("/v2/create-web-call", {
    method: "POST",
    body: JSON.stringify({ agent_id: agentId }),
  });
}