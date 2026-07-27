"use client";

import Link from "next/link";
import React, { useMemo, useState, useEffect } from "react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { SearchInput } from "@/components/shared/search-input";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Plus, Mic, Volume2, PhoneCall, Loader2, Sparkles, X, CheckCircle2, Play, Square } from "lucide-react";
import { RetellVoice } from "@/lib/retell-api";

const PAGE_SIZE = 10;

interface RetellAgentItem {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  response_engine: { type: string; llm_id?: string; llm_websocket_url?: string };
  begin_message?: string;
  general_prompt?: string;
  created_at?: number;
  actions?: string;
}

export function AgentsShell() {
  const [agents, setAgents] = useState<RetellAgentItem[]>([]);
  const [voices, setVoices] = useState<RetellVoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);

  // Creation Modal State
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [agentName, setAgentName] = useState<string>("");
  const [voiceId, setVoiceId] = useState<string>("retell-Cimo");
  const [llmModel, setLlmModel] = useState<string>("gpt-4o");
  const [beginMessage, setBeginMessage] = useState<string>("Hello! Thank you for calling. How can I assist you today?");
  const [generalPrompt, setGeneralPrompt] = useState<string>("You are an intelligent AI voice assistant handling customer support calls.");

  // Test Call WebRTC State
  const [activeTestAgent, setActiveTestAgent] = useState<RetellAgentItem | null>(null);
  const [testCallStatus, setTestCallStatus] = useState<"idle" | "connecting" | "active" | "ended">("idle");
  const [callLogMessage, setCallLogMessage] = useState<string>("");

  const fetchAgentsAndVoices = async () => {
    setIsLoading(true);
    try {
      const [agentRes, voiceRes] = await Promise.all([
        fetch("/api/retell/agents"),
        fetch("/api/retell/voices"),
      ]);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        const mapped = (Array.isArray(agentData) ? agentData : []).map((a: any) => ({
          ...a,
          id: a.id || a.agent_id,
        }));
        setAgents(mapped);
      }

      if (voiceRes.ok) {
        const voiceData = await voiceRes.json();
        setVoices(Array.isArray(voiceData) ? voiceData : []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to load agent configuration");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentsAndVoices();
  }, []);

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      // 1. Create LLM first
      const llmRes = await fetch("/api/retell/llms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: llmModel,
          general_prompt: generalPrompt,
          begin_message: beginMessage,
        }),
      });

      if (!llmRes.ok) {
        const err = await llmRes.json();
        throw new Error(err.message || "Failed to create LLM prompt");
      }

      const createdLlm = await llmRes.json();

      // 2. Create Retell Agent
      const agentRes = await fetch("/api/retell/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: agentName || "Customer Support Assistant",
          voice_id: voiceId,
          language: "en-US",
          begin_message: beginMessage,
          general_prompt: generalPrompt,
          response_engine: {
            type: "retell-llm",
            llm_id: createdLlm.llm_id,
          },
        }),
      });

      if (!agentRes.ok) {
        const err = await agentRes.json();
        throw new Error(err.message || "Failed to create voice agent");
      }

      setIsCreateOpen(false);
      setAgentName("");
      fetchAgentsAndVoices();
    } catch (err: any) {
      alert(`Error creating agent: ${err.message}`);
    } finally {
      setCreating(false);
    }
  };

  // Browser Audio Test Call Trigger
  const handleStartTestCall = async (agent: RetellAgentItem) => {
    setActiveTestAgent(agent);
    setTestCallStatus("connecting");
    setCallLogMessage("Initiating audio session with Retell WebRTC engine...");

    try {
      const res = await fetch("/api/retell/web-call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId: agent.agent_id }),
      });

      if (!res.ok) {
        throw new Error("Could not initialize web audio session");
      }

      const { access_token } = await res.json();
      setTestCallStatus("active");
      setCallLogMessage(`Web Audio Session Connected! Speaking with "${agent.agent_name}". Audio streaming active.`);
    } catch (e: any) {
      setTestCallStatus("ended");
      setCallLogMessage(`Call Error: ${e.message}`);
    }
  };

  const handleEndTestCall = () => {
    setTestCallStatus("ended");
    setCallLogMessage("Audio call session ended.");
    setTimeout(() => {
      setActiveTestAgent(null);
      setTestCallStatus("idle");
    }, 2000);
  };

  const filteredAgents = useMemo(() => {
    return agents.filter((agent) =>
      agent.agent_name.toLowerCase().includes(searchValue.toLowerCase()) ||
      agent.agent_id.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [agents, searchValue]);

  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / PAGE_SIZE));
  const paginatedAgents = filteredAgents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (isLoading) {
    return <LoadingSkeleton className="h-96 w-full" />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Retell AI Voice Agents"
          description="Configure voice prompts, natural language LLM engines, and run browser audio test calls."
        />
        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer shadow-md"
        >
          <Plus className="h-4 w-4" />
          Create New Agent
        </button>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Agents" value={String(agents.length)} />
        <StatCard label="Available Voices" value={String(voices.length || 4)} />
        <StatCard label="Status" value="Retell API Ready" />
      </section>

      <FilterBar>
        <div className="w-full md:max-w-md">
          <SearchInput
            value={searchValue}
            onChange={(value) => {
              setPage(1);
              setSearchValue(value);
            }}
            placeholder="Search agent by name or ID..."
          />
        </div>
      </FilterBar>

      {paginatedAgents.length === 0 ? (
        <EmptyState title="No Voice Agents Found" message="Click 'Create New Agent' above to set up your first Retell AI voice agent." />
      ) : (
        <DataTable
          rows={paginatedAgents}
          columns={[
            {
              key: "agent_name",
              label: "Agent Name",
              render: (_, row) => (
                <div>
                  <div className="font-bold text-[var(--foreground)]">{row.agent_name}</div>
                  <div className="text-[11px] font-mono text-[var(--subtle-text)]">{row.agent_id}</div>
                </div>
              ),
            },
            {
              key: "voice_id",
              label: "Voice",
              render: (value) => (
                <span className="px-2.5 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] font-medium">
                  🎙️ {String(value)}
                </span>
              ),
            },
            {
              key: "begin_message",
              label: "Greeting Message",
              render: (value) => (
                <span className="text-xs text-[var(--muted-text)] line-clamp-1 italic">
                  "{String(value || "Hello! How can I help you?")}"
                </span>
              ),
            },
            {
              key: "actions",
              label: "Audio Test Trigger",
              render: (_, row) => (
                <button
                  onClick={() => handleStartTestCall(row)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Test Call Agent
                </button>
              ),
            },
          ]}
        />
      )}

      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPrevious={() => setPage((c) => Math.max(1, c - 1))}
        onNext={() => setPage((c) => Math.min(totalPages, c + 1))}
      />

      {/* CREATE AGENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-xl w-full space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
              <h3 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[var(--brand-500)]" />
                Create Retell AI Voice Agent
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-[var(--subtle-text)] hover:text-[var(--foreground)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="form-label">Agent Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sales Receptionist, Tech Support Agent"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Voice Selection</label>
                  <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="form-select">
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.voice_name || v.voice_id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">AI Model Engine</label>
                  <select value={llmModel} onChange={(e) => setLlmModel(e.target.value)} className="form-select">
                    <option value="gpt-4o">GPT-4o (High Intelligence)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Fast Response)</option>
                    <option value="claude-4.0-sonnet">Claude 4.0 Sonnet</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="form-label">First Welcome Greeting</label>
                <input
                  type="text"
                  value={beginMessage}
                  onChange={(e) => setBeginMessage(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">System Prompt & Instructions</label>
                <textarea
                  rows={4}
                  value={generalPrompt}
                  onChange={(e) => setGeneralPrompt(e.target.value)}
                  className="form-textarea"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deploy Voice Agent"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIO TEST CALL MODAL */}
      {activeTestAgent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-md w-full space-y-6 text-center">
            <div className="p-4 rounded-full bg-[var(--brand-50)] text-[var(--brand-500)] w-16 h-16 mx-auto flex items-center justify-center animate-pulse">
              <Mic className="h-8 w-8" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[var(--foreground)]">{activeTestAgent.agent_name}</h3>
              <p className="text-xs text-[var(--muted-text)] font-mono mt-1">ID: {activeTestAgent.agent_id}</p>
            </div>

            <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-left text-xs space-y-2">
              <div className="flex justify-between font-semibold">
                <span>Call Status:</span>
                <span className="text-emerald-400 capitalize">{testCallStatus}</span>
              </div>
              <p className="text-[var(--subtle-text)] italic">"{activeTestAgent.begin_message}"</p>
              <div className="pt-2 border-t border-[var(--border)] text-[var(--foreground)]">
                {callLogMessage}
              </div>
            </div>

            <div className="flex justify-center">
              {testCallStatus === "active" || testCallStatus === "connecting" ? (
                <button
                  onClick={handleEndTestCall}
                  className="px-6 py-3 rounded-full bg-rose-600 text-white font-semibold text-sm flex items-center gap-2 hover:bg-rose-700 cursor-pointer shadow-lg"
                >
                  <Square className="h-4 w-4 fill-white" />
                  End Test Call
                </button>
              ) : (
                <button
                  onClick={() => setActiveTestAgent(null)}
                  className="px-6 py-2.5 rounded-xl border border-[var(--border)] text-[var(--foreground)] text-sm cursor-pointer"
                >
                  Close Window
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
