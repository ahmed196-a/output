"use client";

import React, { useState } from "react";
import {
  Bot, Mic, Database, PhoneCall, Cpu, Wrench, Variable, CheckCircle2, Play, Activity, Tag, Sparkles, Send, Trash2, Plus, Loader2, Save
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GroupProps {
  agent: any;
  onSaveSection: (section: string, payload: any) => Promise<void>;
  savingSection: string | null;
}

export function OverviewGroup({ agent, onSaveSection, savingSection }: GroupProps) {
  const [general, setGeneral] = useState({
    name: agent.name || agent.agent_name || "",
    provider: agent.provider || agent.config?.general?.provider || "retell",
    description: agent.description || agent.config?.general?.description || "",
    language: agent.language || "en-US",
    timezone: agent.timezone || agent.config?.general?.timezone || "America/New_York",
    fallback_language: agent.fallback_language || "en-US",
  });

  const [conversation, setConversation] = useState({
    begin_message: agent.begin_message || "",
    general_prompt: agent.general_prompt || "",
    temperature: agent.config?.conversation?.temperature ?? 0.7,
    interruption_sensitivity: agent.config?.conversation?.interruption_sensitivity ?? 0.5,
    silence_timeout: agent.config?.conversation?.silence_timeout ?? 10,
    voice_speed: agent.config?.conversation?.voice_speed ?? 1.0,
  });

  const [voice, setVoice] = useState({
    voice_id: agent.voice_id || "retell-Cimo",
    provider: agent.config?.voice?.provider || "elevenlabs",
    speed: agent.config?.voice?.speed ?? 1.0,
    pitch: agent.config?.voice?.pitch ?? 1.0,
  });

  return (
    <div className="space-y-8 max-w-4xl">
      {/* General Settings Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Bot className="h-4 w-4 text-[var(--brand-500)]" />
            General Agent Settings
          </h3>
          <button
            onClick={() => onSaveSection("general", general)}
            disabled={savingSection === "general"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "general" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "general" ? "Saving..." : "Save General"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Agent Name</label>
            <input
              type="text"
              value={general.name}
              onChange={(e) => setGeneral((p) => ({ ...p, name: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Engine Provider</label>
            <select
              value={general.provider}
              onChange={(e) => setGeneral((p) => ({ ...p, provider: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)] font-bold uppercase"
            >
              <option value="retell">Retell AI Engine</option>
              <option value="vapi">Vapi AI Engine</option>
              <option value="openai">OpenAI Realtime</option>
              <option value="custom">Custom SIP / WebSockets</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-[var(--foreground)] mb-1">Description</label>
            <input
              type="text"
              value={general.description}
              onChange={(e) => setGeneral((p) => ({ ...p, description: e.target.value }))}
              placeholder="Internal description or business purpose..."
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Primary Language</label>
            <select
              value={general.language}
              onChange={(e) => setGeneral((p) => ({ ...p, language: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Timezone</label>
            <select
              value={general.timezone}
              onChange={(e) => setGeneral((p) => ({ ...p, timezone: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            >
              <option value="America/New_York">Eastern Time (US)</option>
              <option value="America/Chicago">Central Time (US)</option>
              <option value="America/Los_Angeles">Pacific Time (US)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Asia/Karachi">Karachi (PKT)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversation & Prompting Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[var(--brand-500)]" />
            Conversation Prompting & Behavior
          </h3>
          <button
            onClick={() => onSaveSection("conversation", conversation)}
            disabled={savingSection === "conversation"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "conversation" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "conversation" ? "Saving..." : "Save Prompt"}
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Initial Greeting Message</label>
            <textarea
              rows={2}
              value={conversation.begin_message}
              onChange={(e) => setConversation((p) => ({ ...p, begin_message: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] resize-none"
            />
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">System Prompt / Instructions</label>
            <textarea
              rows={8}
              value={conversation.general_prompt}
              onChange={(e) => setConversation((p) => ({ ...p, general_prompt: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-mono resize-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block font-semibold text-[var(--subtle-text)] mb-1">Temperature ({conversation.temperature})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={conversation.temperature}
                onChange={(e) => setConversation((p) => ({ ...p, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-[var(--brand-500)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--subtle-text)] mb-1">Interruption Sens. ({conversation.interruption_sensitivity})</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={conversation.interruption_sensitivity}
                onChange={(e) => setConversation((p) => ({ ...p, interruption_sensitivity: parseFloat(e.target.value) }))}
                className="w-full accent-[var(--brand-500)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--subtle-text)] mb-1">Voice Speed ({conversation.voice_speed}x)</label>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.05"
                value={conversation.voice_speed}
                onChange={(e) => setConversation((p) => ({ ...p, voice_speed: parseFloat(e.target.value) }))}
                className="w-full accent-[var(--brand-500)]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[var(--subtle-text)] mb-1">Silence Timeout ({conversation.silence_timeout}s)</label>
              <input
                type="number"
                min="3"
                max="30"
                value={conversation.silence_timeout}
                onChange={(e) => setConversation((p) => ({ ...p, silence_timeout: parseInt(e.target.value) || 10 }))}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] p-1.5 text-xs text-[var(--foreground)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Voice Engine & Audio Preview Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Mic className="h-4 w-4 text-[var(--brand-500)]" />
            Voice Engine & Audio Model
          </h3>
          <button
            onClick={() => onSaveSection("voice", voice)}
            disabled={savingSection === "voice"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "voice" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "voice" ? "Saving..." : "Save Voice"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Voice Profile</label>
            <select
              value={voice.voice_id}
              onChange={(e) => setVoice((p) => ({ ...p, voice_id: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)]"
            >
              <option value="retell-Cimo">retell-Cimo (ElevenLabs Friendly Male)</option>
              <option value="retell-Sarah">retell-Sarah (ElevenLabs Professional Female)</option>
              <option value="retell-James">retell-James (ElevenLabs UK Male)</option>
              <option value="retell-Elena">retell-Elena (ElevenLabs Warm Female)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Voice Provider</label>
            <select
              value={voice.provider}
              onChange={(e) => setVoice((p) => ({ ...p, provider: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)] uppercase font-bold"
            >
              <option value="elevenlabs">ElevenLabs</option>
              <option value="openai">OpenAI TTS</option>
              <option value="cartesia">Cartesia Sonic</option>
              <option value="retell">Retell Native</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

export function IntelligenceGroup({ agent, onSaveSection, savingSection }: GroupProps) {
  const [kbIds, setKbIds] = useState<string[]>(agent.config?.knowledge_base_ids || []);
  const [llm, setLlm] = useState({
    model: agent.response_engine?.model || agent.config?.llm?.model || "gpt-4o",
    temperature: agent.config?.llm?.temperature ?? 0.7,
    top_p: agent.config?.llm?.top_p ?? 1.0,
    presence_penalty: agent.config?.llm?.presence_penalty ?? 0.0,
    frequency_penalty: agent.config?.llm?.frequency_penalty ?? 0.0,
  });

  const [variables, setVariables] = useState<Record<string, string>>(
    agent.config?.variables || {
      BusinessName: "Elixor Tech",
      SupportEmail: "support@callautomate.ai",
      WorkingHours: "9 AM - 5 PM EST",
    }
  );

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Knowledge RAG Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Database className="h-4 w-4 text-[var(--brand-500)]" />
            Knowledge Base RAG Memory
          </h3>
          <button
            onClick={() => onSaveSection("knowledge", { knowledge_base_ids: kbIds })}
            disabled={savingSection === "knowledge"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "knowledge" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "knowledge" ? "Saving..." : "Save Knowledge"}
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {kbIds.length === 0 ? (
            <p className="text-[var(--muted-text)] italic">No Knowledge Bases attached to this agent.</p>
          ) : (
            <div className="space-y-2">
              {kbIds.map((id) => (
                <div key={id} className="flex items-center justify-between rounded-xl border border-[var(--border)] p-3 bg-[var(--surface-2)]">
                  <div>
                    <p className="font-bold text-[var(--foreground)]">Knowledge Base ({id})</p>
                    <p className="text-[10px] font-mono text-[var(--subtle-text)]">Indexed Document RAG</p>
                  </div>
                  <button
                    onClick={() => setKbIds((prev) => prev.filter((item) => item !== id))}
                    className="text-red-400 hover:text-red-300 font-bold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setKbIds((prev) => [...prev, `kb_${Date.now().toString(36)}`])}
            className="flex items-center gap-1.5 rounded-xl border border-dashed border-[var(--border)] px-4 py-2 text-xs font-bold text-[var(--brand-500)] hover:bg-[var(--surface-2)] cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Attach Knowledge Base
          </button>
        </div>
      </div>

      {/* LLM Engine Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Cpu className="h-4 w-4 text-[var(--brand-500)]" />
            LLM Foundation Model Settings
          </h3>
          <button
            onClick={() => onSaveSection("llm", llm)}
            disabled={savingSection === "llm"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "llm" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "llm" ? "Saving..." : "Save LLM"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Model Selection</label>
            <select
              value={llm.model}
              onChange={(e) => setLlm((p) => ({ ...p, model: e.target.value }))}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5 text-xs text-[var(--foreground)] font-mono"
            >
              <option value="gpt-4o">OpenAI GPT-4o</option>
              <option value="gpt-4o-mini">OpenAI GPT-4o-Mini</option>
              <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-[var(--foreground)] mb-1">Top-P ({llm.top_p})</label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={llm.top_p}
              onChange={(e) => setLlm((p) => ({ ...p, top_p: parseFloat(e.target.value) }))}
              className="w-full accent-[var(--brand-500)] mt-2"
            />
          </div>
        </div>
      </div>

      {/* Dynamic Variables Section */}
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Variable className="h-4 w-4 text-[var(--brand-500)]" />
            Dynamic Template Variables
          </h3>
          <button
            onClick={() => onSaveSection("variables", { variables })}
            disabled={savingSection === "variables"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "variables" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "variables" ? "Saving..." : "Save Variables"}
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {Object.entries(variables).map(([key, val]) => (
            <div key={key} className="grid grid-cols-2 gap-3">
              <input
                type="text"
                readOnly
                value={`{{${key}}}`}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs font-mono font-bold text-[var(--brand-500)]"
              />
              <input
                type="text"
                value={val}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setVariables((prev) => ({ ...prev, [key]: newVal }));
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2 text-xs text-[var(--foreground)]"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CommunicationGroup({ agent, onSaveSection, savingSection }: GroupProps) {
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>(
    agent.config?.telephony?.phone_numbers || [agent.phone_number || "+1 (555) 333-4444"]
  );

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <PhoneCall className="h-4 w-4 text-[var(--brand-500)]" />
            Assigned Phone Lines & Telecom Routing
          </h3>
          <button
            onClick={() => onSaveSection("telephony", { phone_numbers: phoneNumbers })}
            disabled={savingSection === "telephony"}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3 py-1.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            {savingSection === "telephony" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {savingSection === "telephony" ? "Saving..." : "Save Telephony"}
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {phoneNumbers.map((num, idx) => (
            <div key={num} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]">
              <div>
                <p className="font-bold font-mono text-[var(--foreground)]">{num}</p>
                <p className="text-[10px] text-[var(--subtle-text)]">Inbound & Outbound PSTN Direct Line</p>
              </div>
              <span className="px-2.5 py-1 text-[10px] rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                Active Routing
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function TestingGroup({ agent }: GroupProps) {
  const [testMode, setTestMode] = useState<"voice" | "chat">("voice");
  const [chatLog, setChatLog] = useState<{ role: "user" | "agent"; text: string }[]>([
    { role: "agent", text: agent.begin_message || "Hello! Thank you for calling. How can I help you today?" }
  ]);
  const [chatInput, setChatInput] = useState("");

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatLog((prev) => [...prev, { role: "user", text: userMsg }]);
    setChatInput("");
    setTimeout(() => {
      setChatLog((prev) => [
        ...prev,
        { role: "agent", text: `AI Response to: "${userMsg}" using model ${agent.response_engine?.model || "GPT-4o"}.` }
      ]);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
            <Play className="h-4 w-4 text-emerald-400" />
            Integrated Testing Studio
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestMode("voice")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                testMode === "voice" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface-2)] text-[var(--muted-text)]"
              )}
            >
              🎙️ WebRTC Voice Test
            </button>
            <button
              onClick={() => setTestMode("chat")}
              className={cn(
                "px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer",
                testMode === "chat" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface-2)] text-[var(--muted-text)]"
              )}
            >
              💬 Interactive Chat Test
            </button>
          </div>
        </div>

        {testMode === "chat" ? (
          <div className="space-y-4">
            <div className="h-64 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3 text-xs">
              {chatLog.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                  <span className="text-[10px] font-bold text-[var(--subtle-text)] uppercase">{msg.role}</span>
                  <div className={cn("max-w-[80%] rounded-xl p-3 mt-0.5", msg.role === "user" ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)]" : "bg-[var(--surface)] border border-[var(--border)] text-[var(--foreground)]")}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a test message to the agent prompt..."
                className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)]"
              />
              <button type="submit" className="rounded-xl bg-[var(--brand-500)] px-4 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90">
                Send
              </button>
            </form>
          </div>
        ) : (
          <div className="p-8 flex flex-col items-center justify-center space-y-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] text-center">
            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center animate-pulse">
              <Mic className="h-7 w-7" />
            </div>
            <div>
              <p className="font-bold text-[var(--foreground)] text-sm">WebRTC Low-Latency Voice Session</p>
              <p className="text-xs text-[var(--muted-text)] mt-1">Connect your microphone to simulate a live phone call in browser.</p>
            </div>
            <button className="rounded-xl bg-emerald-500 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-600 cursor-pointer">
              Start Web Audio Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function AnalyticsGroup({ agent }: GroupProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Activity className="h-4 w-4 text-[var(--brand-500)]" />
          Agent Performance & Telemetry
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Total Calls</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">142</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Success Rate</p>
            <p className="text-lg font-bold text-emerald-400 mt-1">96.4%</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Avg Latency</p>
            <p className="text-lg font-bold text-[var(--brand-500)] mt-1">780ms</p>
          </div>
          <div className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
            <p className="text-[var(--subtle-text)] font-semibold">Total Cost</p>
            <p className="text-lg font-bold text-[var(--foreground)] mt-1">$4.12</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublishingGroup({ agent }: GroupProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-4">
        <h3 className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2 border-b border-[var(--border)] pb-3">
          <Tag className="h-4 w-4 text-[var(--brand-500)]" />
          Version History & Production Deployment
        </h3>

        <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] space-y-2 text-xs">
          <div className="flex justify-between font-bold">
            <span>Current Status:</span>
            <span className="uppercase text-emerald-400">{agent.status || "Draft"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--subtle-text)]">Active Version:</span>
            <span className="font-mono">v{agent.version || 1}</span>
          </div>
        </div>

        <button className="rounded-xl bg-[var(--brand-500)] px-6 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] shadow-md hover:opacity-90 cursor-pointer">
          Publish New Version (v{(agent.version || 1) + 1})
        </button>
      </div>
    </div>
  );
}
