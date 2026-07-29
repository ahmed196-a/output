/**
 * Server-only helper for calling the Retell AI REST API.
 * Never import this in client components.
 *
 * Base URL: https://api.retellai.com
 * Docs:     https://docs.retellai.com
 */

import { isFeatureEnabled, createFeatureUnavailableResponse } from "./retell-config";
import type {
  RetellAgentResponse,
  CreateAgentDto,
  UpdateAgentDto,
  PublishAgentResponse,
  RetellVoice,
  CloneVoiceDto,
  SearchVoiceDto,
  RetellLlmResponse,
  CreateLlmDto,
  UpdateLlmDto,
  RetellPhoneNumberResponse,
  CreatePhoneNumberDto,
  UpdatePhoneNumberDto,
  RetellCallResponse,
  CreatePhoneCallDto,
  CreateBatchCallDto,
  UpdateLiveCallDto,
  StopCallResponse,
  RetellKnowledgeBaseResponse,
  CreateKnowledgeBaseDto,
  UpdateKnowledgeBaseDto,
  RetellTestDefinitionResponse,
  CreateTestDefinitionDto,
  RunBatchTestDto,
  BatchTestResultResponse,
  RetellCallAnalysisResponse,
  RetellConcurrencyStatusResponse,
} from "@/types/retell";

export type { RetellVoice, RetellAgentResponse, RetellLlmResponse };
export type RetellCreateAgentBody = CreateAgentDto;

const RETELL_BASE = "https://api.retellai.com";

export class RetellApiError extends Error {
  status: number;
  data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = "RetellApiError";
    this.status = status;
    this.data = data;
  }
}

export function isRetellConfigured(): boolean {
  return !!process.env.RETELL_API_KEY?.trim();
}

function getRetellKey(): string {
  return process.env.RETELL_API_KEY?.trim() || "";
}

/** Utility to mask sensitive phone numbers in log output */
export function maskPhoneNumber(phone?: string): string {
  if (!phone) return "";
  const cleaned = phone.trim();
  if (cleaned.length <= 6) return "***";
  return `${cleaned.slice(0, 3)} *** *** ${cleaned.slice(-4)}`;
}

/** Structured Logging Helper */
function logRetellRequest(opts: {
  correlationId: string;
  requestId: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  retryCount: number;
}) {
  const timestamp = new Date().toISOString();
  console.log(
    `[${timestamp}] [RetellAPI] [Correlation: ${opts.correlationId}] [Req: ${opts.requestId}] ` +
      `${opts.method} ${opts.path} -> ${opts.status} (${opts.durationMs}ms, retries: ${opts.retryCount})`
  );
}

// ─── Short TTL In-Memory Cache ────────────────────────────────────────────────

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const CACHE_MAP = new Map<string, CacheEntry<any>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCached<T>(key: string): T | null {
  const entry = CACHE_MAP.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    CACHE_MAP.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs = DEFAULT_TTL_MS): void {
  CACHE_MAP.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateCacheKey(key: string): void {
  CACHE_MAP.delete(key);
}

export function invalidateCachePrefix(prefix: string): void {
  for (const k of CACHE_MAP.keys()) {
    if (k.startsWith(prefix)) {
      CACHE_MAP.delete(k);
    }
  }
}

// ─── Core Retell Request Abstraction ──────────────────────────────────────────

export type RequestExtraOpts = {
  idempotencyKey?: string;
  correlationId?: string;
  timeoutMs?: number;
  skipCache?: boolean;
};

async function retellRequest<T>(
  path: string,
  options: RequestInit = {},
  extraOpts: RequestExtraOpts = {}
): Promise<T> {
  if (!isRetellConfigured()) {
    throw new RetellApiError("RETELL_API_KEY env var is not set.", 401);
  }

  const correlationId = extraOpts.correlationId || `corr_${Math.random().toString(36).substring(2, 9)}`;
  const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;
  const method = (options.method || "GET").toUpperCase();
  const timeoutMs = extraOpts.timeoutMs || 30000; // 30s default

  // Caching for GET requests
  const cacheKey = `${method}:${path}`;
  if (method === "GET" && !extraOpts.skipCache) {
    const cached = getCached<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getRetellKey()}`,
    ...(extraOpts.idempotencyKey ? { "Idempotency-Key": extraOpts.idempotencyKey } : {}),
    ...(options.headers as Record<string, string>),
  };

  const startTime = Date.now();
  let attempts = 0;
  const maxRetries = 3;

  while (attempts <= maxRetries) {
    attempts++;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(`${RETELL_BASE}${path}`, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const durationMs = Date.now() - startTime;
      logRetellRequest({
        correlationId,
        requestId,
        method,
        path,
        status: res.status,
        durationMs,
        retryCount: attempts - 1,
      });

      // Handle Rate Limiting (429) & Server Errors (5xx) with Exponential Backoff
      if ((res.status === 429 || res.status >= 500) && attempts <= maxRetries) {
        const backoffMs = Math.pow(2, attempts) * 500;
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      if (!res.ok) {
        let errBody: any;
        try {
          errBody = await res.json();
        } catch {
          errBody = await res.text();
        }
        throw new RetellApiError(
          `Retell API error (${res.status}): ${typeof errBody === "string" ? errBody : JSON.stringify(errBody)}`,
          res.status,
          errBody
        );
      }

      // Format 204 No Content
      if (res.status === 204) {
        return {} as T;
      }

      const responseData = (await res.json()) as T;
      if (method === "GET" && !extraOpts.skipCache) {
        setCached(cacheKey, responseData);
      }
      return responseData;
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        throw new RetellApiError(`Request timed out after ${timeoutMs}ms`, 504);
      }
      if (err instanceof RetellApiError) {
        throw err;
      }
      if (attempts > maxRetries) {
        throw new RetellApiError(err.message || "Network error calling Retell API", 500);
      }
      const backoffMs = Math.pow(2, attempts) * 500;
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }

  throw new RetellApiError("Retell API request failed after maximum retries.", 500);
}

/** Universal Auto-Pagination Helper */
export async function retellPaginate<T>(
  path: string,
  options: RequestInit = {},
  extraOpts: RequestExtraOpts = {}
): Promise<T[]> {
  const aggregated: T[] = [];
  let hasMore = true;
  let paginationKey: string | undefined = undefined;

  while (hasMore) {
    let finalPath = path;
    const body: Record<string, unknown> = options.body ? JSON.parse(options.body as string) : {};

    if (paginationKey) {
      body.pagination_key = paginationKey;
    }

    const response = await retellRequest<any>(
      finalPath,
      {
        ...options,
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      },
      extraOpts
    );

    if (Array.isArray(response)) {
      return response as T[];
    }

    const items = response.items || response.data || response.results || [];
    if (Array.isArray(items)) {
      aggregated.push(...items);
    }

    paginationKey = response.pagination_key || response.next_page_token || response.next_cursor;
    hasMore = !!(response.has_more || response.hasMore) && !!paginationKey;
  }

  return aggregated;
}

// ─── Stateful In-Memory Mock Store ────────────────────────────────────────────

type MockStore = {
  agents: Map<string, RetellAgentResponse>;
  voices: Map<string, RetellVoice>;
  llms: Map<string, RetellLlmResponse>;
  phoneNumbers: Map<string, RetellPhoneNumberResponse>;
  calls: Map<string, RetellCallResponse>;
  knowledgeBases: Map<string, RetellKnowledgeBaseResponse>;
  tests: Map<string, RetellTestDefinitionResponse>;
};

const MOCK_STORE: MockStore = {
  agents: new Map(),
  voices: new Map([
    ["retell-Cimo", { voice_id: "retell-Cimo", voice_name: "Cimo (Friendly Male)", provider: "elevenlabs", accent: "american", gender: "male" }],
    ["retell-Sarah", { voice_id: "retell-Sarah", voice_name: "Sarah (Professional Female)", provider: "elevenlabs", accent: "american", gender: "female" }],
    ["retell-James", { voice_id: "retell-James", voice_name: "James (UK Male)", provider: "elevenlabs", accent: "british", gender: "male" }],
    ["retell-Elena", { voice_id: "retell-Elena", voice_name: "Elena (Warm Female)", provider: "elevenlabs", accent: "american", gender: "female" }],
  ]),
  llms: new Map([
    [
      "llm_default_support_01",
      {
        llm_id: "llm_default_support_01",
        model: "gpt-4o",
        general_prompt: "You are a customer service AI representative handling incoming calls.",
        begin_message: "Hello! Thanks for calling CallAutomate. How can I help you today?",
      },
    ],
  ]),
  phoneNumbers: new Map(),
  calls: new Map(),
  knowledgeBases: new Map(),
  tests: new Map(),
};

// Seed mock agent
MOCK_STORE.agents.set("agent_mock_default", {
  agent_id: "agent_mock_default",
  agent_name: "Support Voice Agent",
  voice_id: "retell-Cimo",
  language: "en-US",
  response_engine: { type: "retell-llm", llm_id: "llm_default_support_01" },
  begin_message: "Hello! Thanks for calling.",
  general_prompt: "You are an AI assistant.",
  created_at: Date.now(),
  version: 1,
});

// ─── Agent Wrappers ───────────────────────────────────────────────────────────

export async function createRetellAgent(
  body: CreateAgentDto,
  userId?: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    const agentId = `agent_${Math.random().toString(36).substring(2, 10)}`;
    const created: RetellAgentResponse = {
      agent_id: agentId,
      agent_name: body.agent_name || "New Voice Agent",
      voice_id: body.voice_id,
      language: body.language || "en-US",
      response_engine: body.response_engine,
      begin_message: body.begin_message || "Hello! How can I assist you?",
      general_prompt: body.general_prompt || "You are an AI assistant.",
      created_at: Date.now(),
      version: 1,
      userId,
    };
    MOCK_STORE.agents.set(agentId, created);
    return created;
  }

  const created = await retellRequest<RetellAgentResponse>(
    "/create-agent",
    { method: "POST", body: JSON.stringify(body) },
    extraOpts
  );
  if (userId) created.userId = userId;
  return created;
}

export async function getRetellAgent(
  agentId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    const found = MOCK_STORE.agents.get(agentId);
    if (found) return found;
    return (
      Array.from(MOCK_STORE.agents.values())[0] || {
        agent_id: agentId,
        agent_name: "Voice Agent",
        voice_id: "retell-Cimo",
        language: "en-US",
        response_engine: { type: "retell-llm" },
      }
    );
  }

  return retellRequest<RetellAgentResponse>(`/get-agent/${agentId}`, {}, extraOpts);
}

export async function updateRetellAgent(
  agentId: string,
  body: UpdateAgentDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellAgentResponse> {
  if (!isRetellConfigured()) {
    const agent = MOCK_STORE.agents.get(agentId);
    if (agent) {
      if (body.agent_name) agent.agent_name = body.agent_name;
      if (body.voice_id) agent.voice_id = body.voice_id;
      if (body.begin_message) agent.begin_message = body.begin_message;
      if (body.general_prompt) agent.general_prompt = body.general_prompt;
      agent.last_modification_timestamp = Date.now();
      MOCK_STORE.agents.set(agentId, agent);
      return agent;
    }
  }

  const res = await retellRequest<RetellAgentResponse>(
    `/update-agent/${agentId}`,
    { method: "PATCH", body: JSON.stringify(body) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-agents");
  return res;
}

export async function deleteRetellAgent(
  agentId: string,
  extraOpts?: RequestExtraOpts
): Promise<void> {
  if (!isRetellConfigured()) {
    MOCK_STORE.agents.delete(agentId);
    return;
  }
  await retellRequest<void>(`/delete-agent/${agentId}`, { method: "DELETE" }, extraOpts);
  invalidateCachePrefix("GET:/list-agents");
}

export async function listRetellAgents(
  userId?: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellAgentResponse[]> {
  if (!isRetellConfigured()) {
    const agents = Array.from(MOCK_STORE.agents.values());
    if (userId) {
      return agents.filter((a) => a.userId === userId || !a.userId);
    }
    return agents;
  }

  try {
    const fetchedAgents = await retellPaginate<RetellAgentResponse>(
      "/v2/list-agents",
      { method: "POST" },
      extraOpts
    );
    const mockAgents = Array.from(MOCK_STORE.agents.values());
    const inMemoryUserAgents = userId ? mockAgents.filter((a) => a.userId === userId) : mockAgents;

    const agentMap = new Map<string, RetellAgentResponse>();
    fetchedAgents.forEach((a) => agentMap.set(a.agent_id, a));
    inMemoryUserAgents.forEach((a) => {
      if (!agentMap.has(a.agent_id)) agentMap.set(a.agent_id, a);
    });

    return Array.from(agentMap.values());
  } catch (e) {
    const mockAgents = Array.from(MOCK_STORE.agents.values());
    if (userId) {
      return mockAgents.filter((a) => a.userId === userId || !a.userId);
    }
    return mockAgents;
  }
}

export async function publishRetellAgent(
  agentId: string,
  extraOpts?: RequestExtraOpts
): Promise<PublishAgentResponse> {
  if (!isRetellConfigured()) {
    const agent = MOCK_STORE.agents.get(agentId);
    const newVersion = (agent?.version || 1) + 1;
    if (agent) {
      agent.version = newVersion;
      MOCK_STORE.agents.set(agentId, agent);
    }
    return { agent_id: agentId, version: newVersion, published_at: Date.now() };
  }

  return retellRequest<PublishAgentResponse>(
    "/publish-agent",
    { method: "POST", body: JSON.stringify({ agent_id: agentId }) },
    extraOpts
  );
}

// ─── Voice Management Wrappers ────────────────────────────────────────────────

export async function listRetellVoices(extraOpts?: RequestExtraOpts): Promise<RetellVoice[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.voices.values());
  }
  try {
    return await retellRequest<RetellVoice[]>("/list-voices", {}, extraOpts);
  } catch {
    return Array.from(MOCK_STORE.voices.values());
  }
}

export async function cloneRetellVoice(
  payload: CloneVoiceDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellVoice> {
  if (!isRetellConfigured()) {
    const voiceId = `voice_${Math.random().toString(36).substring(2, 10)}`;
    const created: RetellVoice = {
      voice_id: voiceId,
      voice_name: payload.voice_name,
      provider: "elevenlabs",
      gender: payload.gender || "male",
    };
    MOCK_STORE.voices.set(voiceId, created);
    return created;
  }

  const res = await retellRequest<RetellVoice>(
    "/clone-voice",
    { method: "POST", body: JSON.stringify(payload) },
    { ...extraOpts, timeoutMs: 120000 } // 120s timeout for voice cloning
  );
  invalidateCachePrefix("GET:/list-voices");
  return res;
}

export async function searchRetellVoices(
  query: SearchVoiceDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellVoice[]> {
  const voices = await listRetellVoices(extraOpts);
  const q = query.query.toLowerCase();
  return voices.filter((v) => v.voice_name.toLowerCase().includes(q) || v.provider.toLowerCase().includes(q));
}

// ─── Retell LLM CRUD Wrappers ─────────────────────────────────────────────────

export async function listRetellLlms(extraOpts?: RequestExtraOpts): Promise<RetellLlmResponse[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.llms.values());
  }
  try {
    return await retellRequest<RetellLlmResponse[]>("/list-retell-llms", {}, extraOpts);
  } catch {
    return Array.from(MOCK_STORE.llms.values());
  }
}

export async function getRetellLlm(
  llmId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellLlmResponse> {
  if (!isRetellConfigured()) {
    return MOCK_STORE.llms.get(llmId) || Array.from(MOCK_STORE.llms.values())[0];
  }
  return retellRequest<RetellLlmResponse>(`/get-retell-llm/${llmId}`, {}, extraOpts);
}

export async function createRetellLlm(
  opts: CreateLlmDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellLlmResponse> {
  if (!isRetellConfigured()) {
    const llmId = `llm_${Math.random().toString(36).substring(2, 10)}`;
    const mockLlm: RetellLlmResponse = {
      llm_id: llmId,
      model: opts.model || "gpt-4o",
      general_prompt: opts.general_prompt || "You are a helpful AI assistant.",
      begin_message: opts.begin_message || "Hello! How can I help you today?",
      knowledge_base_ids: opts.knowledge_base_ids || [],
    };
    MOCK_STORE.llms.set(llmId, mockLlm);
    return mockLlm;
  }

  const res = await retellRequest<RetellLlmResponse>(
    "/create-retell-llm",
    { method: "POST", body: JSON.stringify(opts) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-retell-llms");
  return res;
}

export async function updateRetellLlm(
  llmId: string,
  opts: UpdateLlmDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellLlmResponse> {
  if (!isRetellConfigured()) {
    const llm = MOCK_STORE.llms.get(llmId);
    if (llm) {
      if (opts.general_prompt) llm.general_prompt = opts.general_prompt;
      if (opts.begin_message) llm.begin_message = opts.begin_message;
      if (opts.model) llm.model = opts.model;
      if (opts.knowledge_base_ids) llm.knowledge_base_ids = opts.knowledge_base_ids;
      MOCK_STORE.llms.set(llmId, llm);
      return llm;
    }
  }

  const res = await retellRequest<RetellLlmResponse>(
    `/update-retell-llm/${llmId}`,
    { method: "PATCH", body: JSON.stringify(opts) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-retell-llms");
  return res;
}

export async function deleteRetellLlm(
  llmId: string,
  extraOpts?: RequestExtraOpts
): Promise<void> {
  if (!isRetellConfigured()) {
    MOCK_STORE.llms.delete(llmId);
    return;
  }
  await retellRequest<void>(`/delete-retell-llm/${llmId}`, { method: "DELETE" }, extraOpts);
  invalidateCachePrefix("GET:/list-retell-llms");
}

// ─── Phone Number Management Wrappers ─────────────────────────────────────────

export async function createRetellPhoneNumber(
  payload: CreatePhoneNumberDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellPhoneNumberResponse> {
  if (!isFeatureEnabled("PHONE_NUMBERS")) {
    throw new RetellApiError("Phone Numbers feature disabled.", 503, createFeatureUnavailableResponse("Phone Numbers"));
  }

  if (!isRetellConfigured()) {
    const phoneNum = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const created: RetellPhoneNumberResponse = {
      phone_number: phoneNum,
      phone_number_pretty: maskPhoneNumber(phoneNum),
      nickname: payload.nickname || "Purchased Number",
      inbound_agents: payload.inbound_agents || [],
      outbound_agents: payload.outbound_agents || [],
      created_at: Date.now(),
    };
    MOCK_STORE.phoneNumbers.set(phoneNum, created);
    return created;
  }

  const res = await retellRequest<RetellPhoneNumberResponse>(
    "/create-phone-number",
    { method: "POST", body: JSON.stringify(payload) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-phone-numbers");
  return res;
}

export async function updateRetellPhoneNumber(
  phoneNumber: string,
  payload: UpdatePhoneNumberDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellPhoneNumberResponse> {
  if (!isFeatureEnabled("PHONE_NUMBERS")) {
    throw new RetellApiError("Phone Numbers feature disabled.", 503, createFeatureUnavailableResponse("Phone Numbers"));
  }

  if (!isRetellConfigured()) {
    const num = MOCK_STORE.phoneNumbers.get(phoneNumber) || { phone_number: phoneNumber };
    if (payload.nickname) num.nickname = payload.nickname;
    if (payload.inbound_agents) num.inbound_agents = payload.inbound_agents;
    if (payload.outbound_agents) num.outbound_agents = payload.outbound_agents;
    MOCK_STORE.phoneNumbers.set(phoneNumber, num);
    return num;
  }

  const res = await retellRequest<RetellPhoneNumberResponse>(
    `/update-phone-number/${encodeURIComponent(phoneNumber)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-phone-numbers");
  return res;
}

export async function getRetellPhoneNumber(
  phoneNumber: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellPhoneNumberResponse> {
  if (!isRetellConfigured()) {
    return MOCK_STORE.phoneNumbers.get(phoneNumber) || { phone_number: phoneNumber };
  }
  return retellRequest<RetellPhoneNumberResponse>(
    `/get-phone-number/${encodeURIComponent(phoneNumber)}`,
    {},
    extraOpts
  );
}

export async function listRetellPhoneNumbers(
  extraOpts?: RequestExtraOpts
): Promise<RetellPhoneNumberResponse[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.phoneNumbers.values());
  }
  return retellPaginate<RetellPhoneNumberResponse>("/list-phone-numbers", {}, extraOpts);
}

export async function deleteRetellPhoneNumber(
  phoneNumber: string,
  extraOpts?: RequestExtraOpts
): Promise<void> {
  if (!isRetellConfigured()) {
    MOCK_STORE.phoneNumbers.delete(phoneNumber);
    return;
  }
  await retellRequest<void>(
    `/delete-phone-number/${encodeURIComponent(phoneNumber)}`,
    { method: "DELETE" },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-phone-numbers");
}

export async function associatePhoneNumberWithAgent(
  phoneNumber: string,
  agentId: string,
  extraOpts?: RequestExtraOpts
): Promise<any> {
  if (!isRetellConfigured()) {
    return { success: true, phone_number: phoneNumber, agent_id: agentId, mock: true };
  }

  return retellRequest<any>(
    "/import-phone-number",
    { method: "POST", body: JSON.stringify({ phone_number: phoneNumber, agent_id: agentId }) },
    extraOpts
  );
}

// ─── Call Management & Outbound Calling Wrappers ──────────────────────────────

export async function createRetellPhoneCall(
  payload: CreatePhoneCallDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellCallResponse> {
  if (!isRetellConfigured()) {
    const callId = `call_${Math.random().toString(36).substring(2, 10)}`;
    const created: RetellCallResponse = {
      call_id: callId,
      call_type: "outbound_phone_call",
      call_status: "ongoing",
      agent_id: payload.agent_id || payload.override_agent_id || "agent_mock_default",
      from_number: payload.from_number,
      to_number: payload.to_number,
      start_timestamp: Date.now(),
    };
    MOCK_STORE.calls.set(callId, created);
    return created;
  }

  return retellRequest<RetellCallResponse>(
    "/create-phone-call",
    { method: "POST", body: JSON.stringify(payload) },
    extraOpts
  );
}

export async function createBatchPhoneCall(
  payload: CreateBatchCallDto,
  extraOpts?: RequestExtraOpts
): Promise<{ batch_id: string; total_tasks: number }> {
  if (!isFeatureEnabled("BATCH_CALLS")) {
    throw new RetellApiError("Batch Calls feature disabled.", 503, createFeatureUnavailableResponse("Batch Calls"));
  }

  if (!isRetellConfigured()) {
    const batchId = `batch_${Math.random().toString(36).substring(2, 10)}`;
    payload.tasks.forEach((task) => {
      const callId = `call_${Math.random().toString(36).substring(2, 10)}`;
      MOCK_STORE.calls.set(callId, {
        call_id: callId,
        call_type: "outbound_phone_call",
        call_status: "registered",
        agent_id: task.agent_id || "agent_mock_default",
        from_number: payload.from_number,
        to_number: task.to_number,
      });
    });
    return { batch_id: batchId, total_tasks: payload.tasks.length };
  }

  return retellRequest<{ batch_id: string; total_tasks: number }>(
    "/create-batch-call",
    { method: "POST", body: JSON.stringify(payload) },
    extraOpts
  );
}

export async function createRetellWebCall(
  agentId: string,
  extraOpts?: RequestExtraOpts
): Promise<{ access_token: string; call_id: string }> {
  if (!isRetellConfigured()) {
    return {
      access_token: `mock_webcall_token_${Date.now()}`,
      call_id: `call_mock_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  return retellRequest<{ access_token: string; call_id: string }>(
    "/v2/create-web-call",
    { method: "POST", body: JSON.stringify({ agent_id: agentId }) },
    extraOpts
  );
}

export async function getRetellCall(
  callId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellCallResponse> {
  if (!isRetellConfigured()) {
    return (
      MOCK_STORE.calls.get(callId) || {
        call_id: callId,
        call_type: "phone_call",
        call_status: "ended",
        agent_id: "agent_mock_default",
        duration_ms: 45000,
        transcript: "Agent: Hello! User: Hi there.",
      }
    );
  }
  return retellRequest<RetellCallResponse>(`/get-call/${callId}`, {}, extraOpts);
}

export async function listRetellCalls(
  filter?: Record<string, unknown>,
  extraOpts?: RequestExtraOpts
): Promise<RetellCallResponse[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.calls.values());
  }
  return retellPaginate<RetellCallResponse>(
    "/v2/list-calls",
    { method: "POST", body: JSON.stringify(filter || {}) },
    extraOpts
  );
}

export async function updateLiveCall(
  callId: string,
  payload: UpdateLiveCallDto,
  extraOpts?: RequestExtraOpts
): Promise<{ success: boolean }> {
  if (!isRetellConfigured()) {
    const call = MOCK_STORE.calls.get(callId);
    if (call && payload.action === "hangup") {
      call.call_status = "ended";
      MOCK_STORE.calls.set(callId, call);
    }
    return { success: true };
  }

  return retellRequest<{ success: boolean }>(
    `/update-live-call/${callId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    extraOpts
  );
}

export async function stopRetellCall(
  callId: string,
  extraOpts?: RequestExtraOpts
): Promise<StopCallResponse> {
  if (!isRetellConfigured()) {
    const call = MOCK_STORE.calls.get(callId);
    if (call) {
      call.call_status = "ended";
      MOCK_STORE.calls.set(callId, call);
    }
    return { success: true, call_id: callId };
  }

  return retellRequest<StopCallResponse>(
    `/stop-call/${callId}`,
    { method: "POST" },
    extraOpts
  );
}

// ─── Knowledge Base Wrappers ──────────────────────────────────────────────────

export async function createKnowledgeBase(
  payload: CreateKnowledgeBaseDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellKnowledgeBaseResponse> {
  if (!isFeatureEnabled("KNOWLEDGE_BASE")) {
    throw new RetellApiError("Knowledge Base feature disabled.", 503, createFeatureUnavailableResponse("Knowledge Base"));
  }

  if (!isRetellConfigured()) {
    const kbId = `kb_${Math.random().toString(36).substring(2, 10)}`;
    const created: RetellKnowledgeBaseResponse = {
      knowledge_base_id: kbId,
      knowledge_base_name: payload.knowledge_base_name,
      status: "complete",
      created_at: Date.now(),
    };
    MOCK_STORE.knowledgeBases.set(kbId, created);
    return created;
  }

  const res = await retellRequest<RetellKnowledgeBaseResponse>(
    "/create-knowledge-base",
    { method: "POST", body: JSON.stringify(payload) },
    { ...extraOpts, timeoutMs: 120000 } // 120s timeout
  );
  invalidateCachePrefix("GET:/list-knowledge-bases");
  return res;
}

export async function updateKnowledgeBase(
  kbId: string,
  payload: UpdateKnowledgeBaseDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellKnowledgeBaseResponse> {
  if (!isFeatureEnabled("KNOWLEDGE_BASE")) {
    throw new RetellApiError("Knowledge Base feature disabled.", 503, createFeatureUnavailableResponse("Knowledge Base"));
  }

  if (!isRetellConfigured()) {
    const kb = MOCK_STORE.knowledgeBases.get(kbId) || { knowledge_base_id: kbId, knowledge_base_name: "KB", status: "complete" as const };
    if (payload.knowledge_base_name) kb.knowledge_base_name = payload.knowledge_base_name;
    MOCK_STORE.knowledgeBases.set(kbId, kb);
    return kb;
  }

  const res = await retellRequest<RetellKnowledgeBaseResponse>(
    `/update-knowledge-base/${kbId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    extraOpts
  );
  invalidateCachePrefix("GET:/list-knowledge-bases");
  return res;
}

export async function deleteKnowledgeBase(
  kbId: string,
  extraOpts?: RequestExtraOpts
): Promise<void> {
  if (!isRetellConfigured()) {
    MOCK_STORE.knowledgeBases.delete(kbId);
    return;
  }
  await retellRequest<void>(`/delete-knowledge-base/${kbId}`, { method: "DELETE" }, extraOpts);
  invalidateCachePrefix("GET:/list-knowledge-bases");
}

export async function listKnowledgeBases(
  extraOpts?: RequestExtraOpts
): Promise<RetellKnowledgeBaseResponse[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.knowledgeBases.values());
  }
  return retellPaginate<RetellKnowledgeBaseResponse>("/list-knowledge-bases", {}, extraOpts);
}

export async function getKnowledgeBase(
  kbId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellKnowledgeBaseResponse> {
  if (!isRetellConfigured()) {
    return MOCK_STORE.knowledgeBases.get(kbId) || { knowledge_base_id: kbId, knowledge_base_name: "KB", status: "complete" };
  }
  return retellRequest<RetellKnowledgeBaseResponse>(`/get-knowledge-base/${kbId}`, {}, extraOpts);
}

export async function attachKnowledgeBase(
  llmId: string,
  kbId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellLlmResponse> {
  const llm = await getRetellLlm(llmId, extraOpts);
  const kbIds = new Set(llm.knowledge_base_ids || []);
  kbIds.add(kbId);
  return updateRetellLlm(llmId, { knowledge_base_ids: Array.from(kbIds) }, extraOpts);
}

export async function detachKnowledgeBase(
  llmId: string,
  kbId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellLlmResponse> {
  const llm = await getRetellLlm(llmId, extraOpts);
  const kbIds = (llm.knowledge_base_ids || []).filter((id) => id !== kbId);
  return updateRetellLlm(llmId, { knowledge_base_ids: kbIds }, extraOpts);
}

export async function searchKnowledgeBase(
  kbId: string,
  query: string,
  extraOpts?: RequestExtraOpts
): Promise<{ results: string[] }> {
  if (!isRetellConfigured()) {
    return { results: [`Sample search result from Knowledge Base ${kbId} for query: ${query}`] };
  }
  return retellRequest<{ results: string[] }>(
    `/search-knowledge-base/${kbId}`,
    { method: "POST", body: JSON.stringify({ query }) },
    extraOpts
  );
}

// ─── Testing APIs Wrappers ────────────────────────────────────────────────────

export async function createTestDefinition(
  payload: CreateTestDefinitionDto,
  extraOpts?: RequestExtraOpts
): Promise<RetellTestDefinitionResponse> {
  if (!isFeatureEnabled("TESTING")) {
    throw new RetellApiError("Testing feature disabled.", 503, createFeatureUnavailableResponse("Testing"));
  }

  if (!isRetellConfigured()) {
    const testId = `test_${Math.random().toString(36).substring(2, 10)}`;
    const created: RetellTestDefinitionResponse = {
      test_id: testId,
      name: payload.name,
      agent_id: payload.agent_id,
      evaluators: payload.evaluators || [],
      created_at: Date.now(),
    };
    MOCK_STORE.tests.set(testId, created);
    return created;
  }

  return retellRequest<RetellTestDefinitionResponse>(
    "/create-test-definition",
    { method: "POST", body: JSON.stringify(payload) },
    extraOpts
  );
}

export async function runBatchTests(
  payload: RunBatchTestDto,
  extraOpts?: RequestExtraOpts
): Promise<BatchTestResultResponse> {
  if (!isFeatureEnabled("TESTING")) {
    throw new RetellApiError("Testing feature disabled.", 503, createFeatureUnavailableResponse("Testing"));
  }

  if (!isRetellConfigured()) {
    return {
      batch_id: `batch_test_${Math.random().toString(36).substring(2, 10)}`,
      status: "completed",
      passed_count: payload.test_ids.length,
      failed_count: 0,
      results: payload.test_ids.map((id) => ({ test_id: id, passed: true, details: "Passed all evaluators" })),
    };
  }

  return retellRequest<BatchTestResultResponse>(
    "/run-batch-tests",
    { method: "POST", body: JSON.stringify(payload) },
    extraOpts
  );
}

export async function getTest(
  testId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellTestDefinitionResponse> {
  if (!isRetellConfigured()) {
    return (
      MOCK_STORE.tests.get(testId) || {
        test_id: testId,
        name: "Mock Agent Evaluation",
        agent_id: "agent_mock_default",
        evaluators: [],
      }
    );
  }
  return retellRequest<RetellTestDefinitionResponse>(`/get-test/${testId}`, {}, extraOpts);
}

export async function listTests(
  extraOpts?: RequestExtraOpts
): Promise<RetellTestDefinitionResponse[]> {
  if (!isRetellConfigured()) {
    return Array.from(MOCK_STORE.tests.values());
  }
  return retellPaginate<RetellTestDefinitionResponse>("/list-tests", {}, extraOpts);
}

// ─── Analytics & Concurrency Wrappers ─────────────────────────────────────────

export async function rerunAnalysis(
  callId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellCallAnalysisResponse> {
  if (!isFeatureEnabled("ANALYTICS")) {
    throw new RetellApiError("Analytics feature disabled.", 503, createFeatureUnavailableResponse("Analytics"));
  }

  if (!isRetellConfigured()) {
    return {
      call_id: callId,
      user_sentiment: "Positive",
      call_successful: true,
      transcript_summary: "Customer inquired about pricing and subscription options.",
      in_call_cost: 0.05,
    };
  }

  return retellRequest<RetellCallAnalysisResponse>(
    `/rerun-call-analysis/${callId}`,
    { method: "POST" },
    extraOpts
  );
}

export async function getCallAnalysis(
  callId: string,
  extraOpts?: RequestExtraOpts
): Promise<RetellCallAnalysisResponse> {
  if (!isRetellConfigured()) {
    return {
      call_id: callId,
      user_sentiment: "Positive",
      call_successful: true,
      transcript_summary: "Customer inquired about service details.",
    };
  }
  return retellRequest<RetellCallAnalysisResponse>(`/get-call-analysis/${callId}`, {}, extraOpts);
}

export async function getConcurrencyStatus(
  extraOpts?: RequestExtraOpts
): Promise<RetellConcurrencyStatusResponse> {
  if (!isRetellConfigured()) {
    return { current_concurrency: 2, concurrency_limit: 20 };
  }
  return retellRequest<RetellConcurrencyStatusResponse>("/get-concurrency", {}, extraOpts);
}