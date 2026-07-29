"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu, ArrowLeft, ArrowRight, CheckCircle2, Bot, Mic, Sparkles, Database, PhoneCall, Loader2
} from "lucide-react";

export default function NewAgentPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    provider: "retell",
    language: "en-US",
    voice_id: "retell-Cimo",
    model: "gpt-4o",
    begin_message: "Hello! Thank you for calling. How can I assist you today?",
    general_prompt: "You are a helpful and professional Voice AI assistant.",
  });

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/retell/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_name: form.name || "New Voice Agent",
          voice_id: form.voice_id,
          language: form.language,
          begin_message: form.begin_message,
          general_prompt: form.general_prompt,
          response_engine: {
            type: "retell-llm",
            model: form.model,
          },
        }),
      });

      if (res.ok) {
        const created = await res.json();
        const createdId = created.agent_id || created.id;
        router.push(`/agents/${createdId}`);
      } else {
        const err = await res.json();
        alert(`Creation failed: ${err.message || "Unknown error"}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepClasses = (s: number) =>
    `flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg border transition ${
      step === s
        ? "bg-[var(--brand-500)] text-[var(--brand-btn-text)] border-transparent shadow-xs"
        : step > s
        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
        : "bg-[var(--surface-2)] text-[var(--muted-text)] border-[var(--border)]"
    }`;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <button
          onClick={() => router.push("/agents")}
          className="flex items-center gap-2 text-xs font-bold text-[var(--muted-text)] hover:text-[var(--foreground)] transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Agents
        </button>
        <h1 className="text-lg font-bold text-[var(--foreground)] flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-[var(--brand-500)]" />
          Create New AI Agent
        </h1>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto py-2">
        <div className={stepClasses(1)}>1. Basic Info</div>
        <div className={stepClasses(2)}>2. Voice Engine</div>
        <div className={stepClasses(3)}>3. Prompt & LLM</div>
        <div className={stepClasses(4)}>4. Deploy Workspace</div>
      </div>

      {/* Wizard Step 1: Basic Info */}
      {step === 1 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Bot className="h-5 w-5 text-[var(--brand-500)]" />
            Step 1: Agent Profile & Provider Selection
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Agent Name *</label>
              <input
                type="text"
                placeholder="e.g. Customer Support Representative"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Description</label>
              <input
                type="text"
                placeholder="Handles incoming customer inquiries, returns, and support calls."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">Engine Provider</label>
                <select
                  value={form.provider}
                  onChange={(e) => setForm((p) => ({ ...p, provider: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)]"
                >
                  <option value="retell">Retell AI Engine</option>
                  <option value="vapi">Vapi AI Engine</option>
                  <option value="openai">OpenAI Realtime</option>
                  <option value="custom">Custom SIP / WebSockets</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--foreground)] mb-1">Primary Language</label>
                <select
                  value={form.language}
                  onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)]"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="es-ES">Spanish</option>
                  <option value="fr-FR">French</option>
                  <option value="de-DE">German</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => {
                if (!form.name.trim()) return alert("Please enter an agent name.");
                setStep(2);
              }}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-5 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer"
            >
              Next: Select Voice <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 2: Voice Engine */}
      {step === 2 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Mic className="h-5 w-5 text-[var(--brand-500)]" />
            Step 2: Voice Selection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {[
              { id: "retell-Cimo", name: "retell-Cimo", desc: "Friendly Male (ElevenLabs)" },
              { id: "retell-Sarah", name: "retell-Sarah", desc: "Professional Female (ElevenLabs)" },
              { id: "retell-James", name: "retell-James", desc: "UK Male Accent (ElevenLabs)" },
              { id: "retell-Elena", name: "retell-Elena", desc: "Warm & Conversational Female" },
            ].map((v) => (
              <div
                key={v.id}
                onClick={() => setForm((p) => ({ ...p, voice_id: v.id }))}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                  form.voice_id === v.id
                    ? "border-[var(--brand-500)] bg-[var(--brand-100)]/20"
                    : "border-[var(--border)] bg-[var(--surface-2)] hover:border-[var(--brand-500)]/50"
                }`}
              >
                <div>
                  <p className="font-bold text-[var(--foreground)]">{v.name}</p>
                  <p className="text-[11px] text-[var(--subtle-text)]">{v.desc}</p>
                </div>
                {form.voice_id === v.id && <CheckCircle2 className="h-5 w-5 text-[var(--brand-500)]" />}
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-5 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer"
            >
              Next: LLM & Prompt <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 3: Prompt & LLM */}
      {step === 3 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <Cpu className="h-5 w-5 text-[var(--brand-500)]" />
            Step 3: LLM Model & System Instructions
          </h2>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">LLM Model</label>
              <select
                value={form.model}
                onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-sm text-[var(--foreground)]"
              >
                <option value="gpt-4o">OpenAI GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">OpenAI GPT-4o-Mini (Fast & Cheap)</option>
                <option value="claude-3.5-sonnet">Anthropic Claude 3.5 Sonnet</option>
                <option value="gemini-1.5-pro">Google Gemini 1.5 Pro</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">Initial Greeting Message</label>
              <textarea
                rows={2}
                value={form.begin_message}
                onChange={(e) => setForm((p) => ({ ...p, begin_message: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-[var(--foreground)] mb-1">System Prompt / Instructions</label>
              <textarea
                rows={5}
                value={form.general_prompt}
                onChange={(e) => setForm((p) => ({ ...p, general_prompt: e.target.value }))}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-xs text-[var(--foreground)] font-mono resize-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(2)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={() => setStep(4)}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-5 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition cursor-pointer"
            >
              Next: Review & Deploy <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Wizard Step 4: Deploy */}
      {step === 4 && (
        <div className="p-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] space-y-5">
          <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            Step 4: Review & Initialize Agent Workspace
          </h2>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3 text-xs">
            <div className="flex justify-between border-b border-[var(--border-light)] pb-2">
              <span className="text-[var(--muted-text)]">Agent Name:</span>
              <span className="font-bold text-[var(--foreground)]">{form.name}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-light)] pb-2">
              <span className="text-[var(--muted-text)]">Provider Engine:</span>
              <span className="font-bold uppercase text-[var(--brand-500)]">{form.provider}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--border-light)] pb-2">
              <span className="text-[var(--muted-text)]">Voice Profile:</span>
              <span className="font-mono text-[var(--foreground)]">{form.voice_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted-text)]">LLM Model:</span>
              <span className="font-mono text-[var(--foreground)]">{form.model}</span>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button
              onClick={() => setStep(3)}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-xs font-bold text-[var(--muted-text)] hover:text-[var(--foreground)] cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-[var(--brand-500)] px-6 py-2.5 text-xs font-bold text-[var(--brand-btn-text)] hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-md"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Creating Workspace..." : "Create & Open Workspace"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
