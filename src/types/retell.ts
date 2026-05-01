// ─── Retell Agent Types ───────────────────────────────────────────────────────

export type RetellAgentStatus = "active" | "inactive";

export type RetellAgentConfig = {
  voice_id?: string;
  language?: string;
  response_engine?: string;
  llm_websocket_url?: string;
  begin_message?: string;
  general_prompt?: string;
  ambient_sound?: string;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  max_call_duration_ms?: number;
  [key: string]: unknown;
};

/** Row in public.agents */
export type RetellAgent = {
  id: string;
  retell_agent_id: string;
  name: string;
  voice_id: string | null;
  language: string;
  response_engine: string;
  llm_websocket_url: string | null;
  begin_message: string | null;
  general_prompt: string | null;
  config: RetellAgentConfig;
  created_by: string;
  tenant_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

/** Payload for creating a new agent */
export type CreateRetellAgentPayload = {
  name: string;
  voice_id?: string;
  language?: string;
  response_engine?: string;
  llm_websocket_url?: string;
  begin_message?: string;
  general_prompt?: string;
  config?: RetellAgentConfig;
  assign_user_ids?: string[];   // users to grant access immediately
};

// ─── Call Log Types ───────────────────────────────────────────────────────────

export type CallStatus = "registered" | "ongoing" | "ended" | "error" | "unknown";

export type TranscriptTurn = {
  role: "agent" | "user";
  content: string;
};

/** Row in public.call_logs */
export type CallLog = {
  id: string;
  retell_call_id: string;
  retell_agent_id: string;
  agent_id: string | null;
  call_status: CallStatus;
  start_timestamp: number | null;   // ms epoch
  end_timestamp: number | null;
  duration_seconds: number | null;  // generated column
  from_number: string | null;
  to_number: string | null;
  transcript: string | null;
  transcript_object: TranscriptTurn[] | null;
  recording_url: string | null;
  call_cost: number | null;
  disconnection_reason: string | null;
  call_analysis: Record<string, unknown> | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  // joined
  agent?: Pick<RetellAgent, "id" | "name" | "retell_agent_id">;
};

// ─── Analytics Types ──────────────────────────────────────────────────────────

export type AgentAnalytics = {
  agent_id: string;
  agent_name: string;
  retell_agent_id: string;
  total_calls: number;
  completed_calls: number;
  total_duration_seconds: number;
  avg_duration_seconds: number;
  total_cost: number;
  success_rate: number;
};

export type CallLogsOverview = {
  total_calls: number;
  ongoing_calls: number;
  completed_calls: number;
  total_duration_seconds: number;
  total_cost: number;
  per_agent: AgentAnalytics[];
};
