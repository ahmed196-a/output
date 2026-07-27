"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Bot, Users, UserCheck, Loader2, Search, RefreshCw, UserMinus } from "lucide-react";

interface AdminAgentItem {
  id: string;
  agent_id: string;
  agent_name: string;
  voice_id: string;
  language: string;
  begin_message?: string;
  general_prompt?: string;
  created_at?: number;
  userId?: string | null;
  userEmail: string;
  userName: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<AdminAgentItem[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Reassignment Modal State
  const [reassignTargetAgent, setReassignTargetAgent] = useState<AdminAgentItem | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [reassigning, setReassigning] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agentRes, userRes] = await Promise.all([
        fetch("/api/admin/agents"),
        fetch("/api/admin/users"),
      ]);

      if (agentRes.ok) {
        const agentData = await agentRes.json();
        setAgents(Array.isArray(agentData) ? agentData : []);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUsers(Array.isArray(userData) ? userData : []);
      }
    } catch (e) {
      console.error("[Admin Agents Fetch Error]", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReassign = async (targetAgent?: AdminAgentItem, userIdToAssign?: string) => {
    const agent = targetAgent || reassignTargetAgent;
    const targetUid = userIdToAssign !== undefined ? userIdToAssign : selectedUserId;

    if (!agent) return;

    setReassigning(true);
    try {
      const res = await fetch("/api/admin/agents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: agent.agent_id || agent.id,
          agentName: agent.agent_name,
          targetUserId: targetUid === "unassigned" ? null : targetUid,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to reassign voice agent");
      }

      setReassignTargetAgent(null);
      setSelectedUserId("");
      fetchData();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setReassigning(false);
    }
  };

  const filteredAgents = agents.filter(
    (a) =>
      a.agent_name.toLowerCase().includes(search.toLowerCase()) ||
      a.agent_id.toLowerCase().includes(search.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      a.userName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Voice Agents Management"
        description="View all Retell AI agents deployed on the platform, assign agent ownership, or free/unassign agents from user accounts."
      />

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--subtle-text)]" />
          <input
            type="text"
            placeholder="Search by agent name, ID, or owner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="premium-table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Agent Name & ID</th>
              <th>Voice Engine</th>
              <th>Owner User</th>
              <th>Greeting Preview</th>
              <th>Created Date</th>
              <th>Admin Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-500)] mx-auto" />
                </td>
              </tr>
            ) : filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-[var(--muted-text)] text-sm">
                  No voice agents found.
                </td>
              </tr>
            ) : (
              filteredAgents.map((a) => (
                <tr key={a.id || a.agent_id}>
                  <td>
                    <div>
                      <div className="font-bold text-[var(--foreground)]">{a.agent_name}</div>
                      <div className="text-[11px] font-mono text-[var(--subtle-text)]">{a.agent_id}</div>
                    </div>
                  </td>
                  <td>
                    <span className="px-2.5 py-1 text-xs rounded-full bg-[var(--surface-2)] text-[var(--foreground)] border border-[var(--border)] font-medium">
                      🎙️ {a.voice_id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="font-semibold text-xs text-[var(--foreground)]">
                        {a.userId ? a.userName : <span className="text-emerald-400 font-bold">🔓 Unassigned (Free)</span>}
                      </div>
                      <div className="text-[11px] text-[var(--subtle-text)]">{a.userId ? a.userEmail : "Available to assign"}</div>
                    </div>
                  </td>
                  <td>
                    <span className="text-xs text-[var(--muted-text)] line-clamp-1 italic">
                      "{a.begin_message || "Hello! How can I help you?"}"
                    </span>
                  </td>
                  <td className="text-xs text-[var(--muted-text)]">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : "Recent"}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setReassignTargetAgent(a);
                          setSelectedUserId(a.userId || "unassigned");
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[var(--brand-500)] text-[var(--brand-btn-text)] text-xs font-semibold hover:opacity-90 cursor-pointer flex items-center gap-1"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        Reassign
                      </button>

                      {a.userId && (
                        <button
                          onClick={() => {
                            if (confirm(`Free / Unassign agent "${a.agent_name}" from ${a.userEmail}?`)) {
                              handleReassign(a, "unassigned");
                            }
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-medium border border-red-500/20 cursor-pointer flex items-center gap-1"
                          title="Unassign agent from user"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          Free
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* REASSIGN / UNASSIGN AGENT MODAL */}
      {reassignTargetAgent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl max-w-md w-full space-y-5">
            <h3 className="text-lg font-bold text-[var(--foreground)]">Assign / Free Voice Agent</h3>
            <div className="p-4 rounded-xl bg-[var(--surface-2)] space-y-1 text-sm">
              <div className="text-[var(--subtle-text)] text-xs">Target Agent:</div>
              <div className="font-bold text-base text-[var(--foreground)]">{reassignTargetAgent.agent_name}</div>
              <div className="text-xs text-[var(--muted-text)] font-mono">ID: {reassignTargetAgent.agent_id}</div>
              <div className="text-xs text-[var(--muted-text)]">
                Current Owner: {reassignTargetAgent.userId ? reassignTargetAgent.userEmail : "Unassigned"}
              </div>
            </div>

            <div>
              <label className="form-label">Select Owner Account</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="form-select"
              >
                <option value="unassigned">🔓 Unassigned / Free Agent (No User)</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    👤 {u.full_name} ({u.email}) - {u.role}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setReassignTargetAgent(null)}
                className="flex-1 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted-text)] hover:bg-[var(--surface-2)] text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReassign()}
                disabled={reassigning}
                className="flex-1 py-2.5 rounded-xl bg-[var(--brand-500)] text-[var(--brand-btn-text)] font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {reassigning ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Assignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}