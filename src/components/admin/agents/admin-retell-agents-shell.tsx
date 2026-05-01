"use client";

import { useState } from "react";
import {
  Bot, Plus, Trash2, RefreshCw, Users, Mic, Globe,
  ChevronRight, MoreHorizontal, Loader2, AlertCircle
} from "lucide-react";
import { useAdminRetellAgentsQuery, useCreateRetellAgentMutation, useDeleteRetellAgentMutation, useAgentAccessQuery, useGrantAgentAccessMutation, useRevokeAgentAccessMutation } from "@/hooks/admin/use-admin-retell-agents-query";
import { useAdminUsersQuery } from "@/hooks/admin/use-admin-users-query";
import { CreateRetellAgentPayload, RetellAgent } from "@/types/retell";
import { cn } from "@/lib/utils";

// ─── Create Agent Modal ────────────────────────────────────────────────────────
function CreateAgentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<CreateRetellAgentPayload>({
    name: "",
    language: "en-US",
    response_engine: "retell-llm",
    voice_id: "",
    begin_message: "",
    general_prompt: "",
    assign_user_ids: [],
  });

  const { data: users = [] } = useAdminUsersQuery();
  const { mutate: createAgent, isPending, error } = useCreateRetellAgentMutation();

  const regularUsers = users.filter((u) =>
    !["super_admin", "operations", "support", "finance"].includes(u.role)
  );

  function toggle(userId: string) {
    setForm((prev) => {
      const ids = prev.assign_user_ids ?? [];
      return {
        ...prev,
        assign_user_ids: ids.includes(userId)
          ? ids.filter((id) => id !== userId)
          : [...ids, userId],
      };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    createAgent(form, { onSuccess: onClose });
  }

  const inputCls = "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-slate-900">Create New Agent</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-100">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{(error as Error).message}</span>
            </div>
          )}

          <div>
            <label className={labelCls}>Agent Name <span className="text-red-500">*</span></label>
            <input
              className={inputCls}
              placeholder="e.g. Sales Assistant"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Language</label>
              <select
                className={inputCls}
                value={form.language}
                onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="pt-BR">Portuguese (BR)</option>
                <option value="ja-JP">Japanese</option>
                <option value="zh-CN">Chinese (Mandarin)</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Response Engine</label>
              <select
                className={inputCls}
                value={form.response_engine}
                onChange={(e) => setForm((p) => ({ ...p, response_engine: e.target.value }))}
              >
                <option value="retell-llm">Retell LLM</option>
                <option value="custom-llm">Custom LLM (WebSocket)</option>
              </select>
            </div>
          </div>

          {form.response_engine === "custom-llm" && (
            <div>
              <label className={labelCls}>LLM WebSocket URL</label>
              <input
                className={inputCls}
                placeholder="wss://your-llm.example.com/ws"
                value={form.llm_websocket_url ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, llm_websocket_url: e.target.value }))}
              />
            </div>
          )}

          <div>
            <label className={labelCls}>Voice ID</label>
            <input
              className={inputCls}
              placeholder="e.g. 11labs-Adrian (from Retell dashboard)"
              value={form.voice_id ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, voice_id: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelCls}>Begin Message</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={2}
              placeholder="Hello! How can I help you today?"
              value={form.begin_message ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, begin_message: e.target.value }))}
            />
          </div>

          <div>
            <label className={labelCls}>General Prompt / System Prompt</label>
            <textarea
              className={cn(inputCls, "resize-none")}
              rows={4}
              placeholder="You are a helpful assistant..."
              value={form.general_prompt ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, general_prompt: e.target.value }))}
            />
          </div>

          {regularUsers.length > 0 && (
            <div>
              <label className={labelCls}>Grant Access To Users</label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 divide-y">
                {regularUsers.map((u) => {
                  const checked = (form.assign_user_ids ?? []).includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded"
                        checked={checked}
                        onChange={() => toggle(u.id)}
                      />
                      <span className="text-sm text-slate-700">{u.full_name}</span>
                      <span className="ml-auto text-xs text-slate-400">{u.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending ? "Creating on Retell…" : "Create Agent"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onDelete,
  onManageAccess,
}: {
  agent: RetellAgent;
  onDelete: (id: string, name: string) => void;
  onManageAccess: (agent: RetellAgent) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Bot className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <p className="font-medium text-slate-900">{agent.name}</p>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{agent.retell_agent_id}</p>
          </div>
        </div>
        <span className={cn(
          "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
          agent.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
        )}>
          {agent.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="flex items-center gap-1.5 text-slate-500">
          <Globe className="h-3.5 w-3.5" />
          <span>{agent.language}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Mic className="h-3.5 w-3.5" />
          <span className="truncate">{agent.voice_id ?? "Default voice"}</span>
        </div>
      </div>

      {agent.begin_message && (
        <p className="mt-3 truncate text-xs text-slate-400 italic">
          &ldquo;{agent.begin_message}&rdquo;
        </p>
      )}

      <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          onClick={() => onManageAccess(agent)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
        >
          <Users className="h-3.5 w-3.5" />
          Manage Access
        </button>
        <button
          onClick={() => onDelete(agent.id, agent.name)}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </div>
  );
}

// ─── Access Management Modal ──────────────────────────────────────────────────
function AccessModal({ agent, onClose }: { agent: RetellAgent; onClose: () => void }) {
  const { data: accessList = [], isLoading } = useAgentAccessQuery(agent.id);
  const { data: allUsers = [] } = useAdminUsersQuery();
  const grantMutation = useGrantAgentAccessMutation(agent.id);
  const revokeMutation = useRevokeAgentAccessMutation(agent.id);

  const grantedIds = new Set((accessList as Array<{ user_id: string }>).map((a) => a.user_id));
  const regularUsers = allUsers.filter((u) =>
    !["super_admin", "operations", "support", "finance"].includes(u.role)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Manage Access</h2>
            <p className="text-xs text-slate-400 mt-0.5">{agent.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            </div>
          ) : regularUsers.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">No regular users found.</p>
          ) : (
            <div className="space-y-2">
              {regularUsers.map((u) => {
                const hasAccess = grantedIds.has(u.id);
                const busy = grantMutation.isPending || revokeMutation.isPending;
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{u.full_name}</p>
                      <p className="text-xs text-slate-400">{u.email} · {u.role}</p>
                    </div>
                    <button
                      disabled={busy}
                      onClick={() => {
                        if (hasAccess) revokeMutation.mutate([u.id]);
                        else grantMutation.mutate([u.id]);
                      }}
                      className={cn(
                        "rounded-lg px-3 py-1.5 text-xs font-medium transition disabled:opacity-50",
                        hasAccess
                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                          : "bg-slate-900 text-white hover:bg-slate-700"
                      )}
                    >
                      {hasAccess ? "Revoke" : "Grant"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="border-t px-6 py-4">
          <button onClick={onClose} className="w-full rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Shell ────────────────────────────────────────────────────────────────
export function AdminRetellAgentsShell() {
  const [showCreate, setShowCreate] = useState(false);
  const [accessAgent, setAccessAgent] = useState<RetellAgent | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: agents = [], isLoading, error, refetch, isRefetching } = useAdminRetellAgentsQuery();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteRetellAgentMutation();

  function confirmDelete() {
    if (!deleteTarget) return;
    deleteAgent(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">AI Voice Agents</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create and manage Retell AI agents. Changes sync to Retell in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={cn("h-4 w-4", isRefetching && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            New Agent
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-600">{(error as Error).message}</p>
          <button onClick={() => refetch()} className="text-sm underline text-slate-500">Retry</button>
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-200 py-20 text-center">
          <Bot className="h-10 w-10 text-slate-300" />
          <div>
            <p className="font-medium text-slate-700">No agents yet</p>
            <p className="mt-1 text-sm text-slate-400">Create your first Retell AI agent to get started.</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            <Plus className="h-4 w-4" />
            Create Agent
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onDelete={(id, name) => setDeleteTarget({ id, name })}
              onManageAccess={setAccessAgent}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateAgentModal onClose={() => setShowCreate(false)} />}
      {accessAgent && <AccessModal agent={accessAgent} onClose={() => setAccessAgent(null)} />}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-semibold text-slate-900">Delete Agent</h3>
            <p className="mt-2 text-sm text-slate-500">
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This will also
              remove it from Retell and cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}