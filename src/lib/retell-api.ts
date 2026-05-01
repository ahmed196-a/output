/**
 * Server-only helper for calling the Retell AI REST API.
 * Never import this in client components.
 *
 * Base URL: https://api.retellai.com  (no /v2 prefix)
 * Docs:     https://docs.retellai.com/api-references/create-agent
 */

const RETELL_BASE = "https://api.retellai.com";

function getRetellKey(): string {
  const key = process.env.RETELL_API_KEY;
  if (!key) throw new Error("RETELL_API_KEY env var is not set.");
  return key;
}

async function retellFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
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

// ─── LLM (must be created before an agent) ───────────────────────────────────

export type RetellLlmResponse = {
  llm_id: string;
  general_prompt?: string;
  begin_message?: string;
  [key: string]: unknown;
};

/**
 * POST /create-retell-llm
 * Creates a Retell LLM and returns its llm_id, which is required
 * when creating an agent with response_engine type "retell-llm".
 */
export async function createRetellLlm(opts: {
  general_prompt?: string;
  begin_message?: string;
}): Promise<RetellLlmResponse> {
  const body: Record<string, unknown> = {};
  if (opts.general_prompt?.trim()) body.general_prompt = opts.general_prompt.trim();
  if (opts.begin_message?.trim()) body.begin_message = opts.begin_message.trim();
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

/** POST /create-agent */
export async function createRetellAgent(body: RetellCreateAgentBody): Promise<RetellAgentResponse> {
  return retellFetch<RetellAgentResponse>("/create-agent", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** GET /get-agent/{agent_id} */
export async function getRetellAgent(agentId: string): Promise<RetellAgentResponse> {
  return retellFetch<RetellAgentResponse>(`/get-agent/${agentId}`);
}

/** PATCH /update-agent/{agent_id} */
export async function updateRetellAgent(
  agentId: string,
  body: Partial<RetellCreateAgentBody>
): Promise<RetellAgentResponse> {
  return retellFetch<RetellAgentResponse>(`/update-agent/${agentId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** DELETE /delete-agent/{agent_id} */
export async function deleteRetellAgent(agentId: string): Promise<void> {
  await retellFetch<void>(`/delete-agent/${agentId}`, { method: "DELETE" });
}

/** GET /list-agents */
export async function listRetellAgents(): Promise<RetellAgentResponse[]> {
  return retellFetch<RetellAgentResponse[]>("/list-agents");
}