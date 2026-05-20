"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { ManagedUser } from "@/services/admin/adminUsersService";
import { Search, Bot, UserCheck, X } from "lucide-react";
import { formatDateTime } from "@/utils/format";

// ── Types ─────────────────────────────────────────────────────────────────────
type AssignmentRow = { id: string; user_id: string; assistant_id: string; assigned_at: string };

// ── Fetchers ──────────────────────────────────────────────────────────────────
// async function fetchUsers(): Promise<ManagedUser[]> {
//   const res = await fetch("/api/admin/users");
//   if (!res.ok) throw new Error("Failed to fetch users.");
//   const data = await res.json();
//   return data.map((row: any) => ({
//     id: row.id, email: row.email, fullName: row.full_name,
//     role: row.role, tenantId: row.tenant_id ?? null,
//     isActive: row.is_active, createdAt: row.created_at,
//   }));
// }

async function fetchUsers(): Promise<ManagedUser[]> {
  const res = await fetch("/api/admin/users");

  if (!res.ok) throw new Error("Failed to fetch users.");

  const data = await res.json();

  return data
    .filter((row: any) =>
      row.role === "member" || row.role === "owner"
    )
    .map((row: any) => ({
      id: row.id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
      tenantId: row.tenant_id ?? null,
      isActive: row.is_active,
      createdAt: row.created_at,
    }));
}

async function fetchAssistantIds(): Promise<string[]> {
  const res = await fetch("/api/admin/agents/assistant-ids");
  if (!res.ok) throw new Error("Failed to fetch assistant IDs.");
  return res.json();
}

async function fetchAssignments(): Promise<AssignmentRow[]> {
  const res = await fetch("/api/admin/agents/user-assignments");
  if (!res.ok) throw new Error("Failed to fetch assignments.");
  return res.json();
}

async function assignAssistant(user_id: string, assistant_id: string) {
  const res = await fetch("/api/admin/agents/user-assignments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, assistant_id }),
  });
  if (!res.ok) throw new Error("Failed to assign.");
}

async function unassignAssistant(user_id: string) {
  const res = await fetch("/api/admin/agents/user-assignments", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id }),
  });
  if (!res.ok) throw new Error("Failed to unassign.");
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminAgentAccessShell() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>("");

  const { data: users = [], isLoading: usersLoading, error: usersError } =
    useQuery({ queryKey: ["admin", "users"], queryFn: fetchUsers });

  const { data: assistantIds = [], isLoading: idsLoading } =
    useQuery({ queryKey: ["admin", "assistant-ids"], queryFn: fetchAssistantIds });

  const { data: assignments = [] } =
    useQuery({ queryKey: ["admin", "user-assignments"], queryFn: fetchAssignments });

  const assignMutation = useMutation({
    mutationFn: ({ userId, assistantId }: { userId: string; assistantId: string }) =>
      assignAssistant(userId, assistantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user-assignments"] }),
  });

  const unassignMutation = useMutation({
    mutationFn: (userId: string) => unassignAssistant(userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user-assignments"] }),
  });

  const assignmentMap = Object.fromEntries(
    assignments.map((a) => [a.user_id, a])
  );

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.tenantId ?? "").toLowerCase().includes(q)
    );
  });

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;
  const currentAssignment = selectedUserId ? assignmentMap[selectedUserId] : null;

  const handleAssign = () => {
    if (!selectedUserId || !selectedAssistantId) return;
    assignMutation.mutate({ userId: selectedUserId, assistantId: selectedAssistantId });
  };

  return (
    <AdminPermissionGuard allow={["agents"]}>
      <div className="space-y-6">
        <PageHeader
          title="Agent Access"
          description="Assign assistant IDs from CDR records to users/owners."
        />

        <div className="flex flex-col gap-6 lg:flex-row lg:min-h-[600px]">
          {/* ── Left: User List ── */}
          <div className="w-full lg:w-80 lg:shrink-0 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users…"
                className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>

            {usersLoading ? (
              <LoadingSkeleton className="h-60 w-full" />
            ) : usersError ? (
              <ErrorState message="Could not load users." />
            ) : filteredUsers.length === 0 ? (
              <EmptyState title="No users found" message="Try a different search." />
            ) : (
              <ul className="space-y-1 overflow-y-auto max-h-[540px] pr-1">
                {filteredUsers.map((user) => {
                  const hasAssignment = !!assignmentMap[user.id];
                  const isActive = selectedUserId === user.id;
                  return (
                    <li key={user.id}>
                      <button
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setSelectedAssistantId(assignmentMap[user.id]?.assistant_id ?? "");
                        }}
                        className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition-all flex items-center justify-between gap-2 ${
                          isActive
                            ? "bg-indigo-600 text-white"
                            : "hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="font-medium truncate">{user.fullName || user.email}</p>
                          <p className={`text-xs truncate ${isActive ? "text-indigo-200" : "text-slate-400"}`}>
                            {user.email}
                          </p>
                        </div>
                        {hasAssignment && (
                          <span className={`shrink-0 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            isActive ? "bg-indigo-500 text-white" : "bg-green-100 text-green-700"
                          }`}>
                            <UserCheck className="h-2.5 w-2.5" /> Assigned
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* ── Right: Assignment Panel ── */}
          <div className="flex-1">
            {!selectedUser ? (
              <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-slate-200">
                <div className="text-center space-y-2">
                  <Bot className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-sm text-slate-400">Select a user to assign an assistant</p>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* User header */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-slate-900">
                        {selectedUser.fullName || selectedUser.email}
                      </h2>
                      <p className="text-sm text-slate-500">{selectedUser.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-indigo-50 text-indigo-600">
                          {selectedUser.role}
                        </span>
                        <StatusBadge
                          text={selectedUser.isActive ? "Active" : "Inactive"}
                          variant={selectedUser.isActive ? "success" : "neutral"}
                        />
                        {selectedUser.tenantId && (
                          <span className="text-xs text-slate-400">
                            Tenant: {selectedUser.tenantId}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      Joined {formatDateTime(selectedUser.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Current assignment */}
                {currentAssignment && (
                  <div className="rounded-2xl border border-green-200 bg-green-50 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-0.5">
                        Currently Assigned
                      </p>
                      <p className="text-sm font-mono font-medium text-green-800">
                        {currentAssignment.assistant_id}
                      </p>
                      <p className="text-xs text-green-600 mt-0.5">
                        Assigned {formatDateTime(currentAssignment.assigned_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => unassignMutation.mutate(selectedUser.id)}
                      disabled={unassignMutation.isPending}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                    >
                      <X className="h-3 w-3" /> Remove
                    </button>
                  </div>
                )}

                {/* Assign new */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">
                    {currentAssignment ? "Change Assignment" : "Assign Assistant ID"}
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <select
                      value={selectedAssistantId}
                      onChange={(e) => setSelectedAssistantId(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                      disabled={idsLoading}
                    >
                      <option value="">
                        {idsLoading ? "Loading assistant IDs…" : "Select an assistant ID…"}
                      </option>
                      {assistantIds.map((id) => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedAssistantId || assignMutation.isPending}
                      className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all disabled:opacity-40"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                    >
                      {assignMutation.isPending ? "Saving…" : currentAssignment ? "Update" : "Assign"}
                    </button>
                  </div>
                  {assistantIds.length === 0 && !idsLoading && (
                    <p className="text-xs text-slate-400">
                      No assistant IDs found in CDR records yet.
                    </p>
                  )}
                </div>

                {/* All assignments overview */}
                {assignments.length > 0 && (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3">
                      All Assignments ({assignments.length})
                    </h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {assignments.map((a) => {
                        const user = users.find((u) => u.id === a.user_id);
                        return (
                          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm gap-1">
                            <div>
                              <span className="font-medium text-slate-800">
                                {user?.fullName || user?.email || a.user_id.slice(0, 8)}
                              </span>
                              <span className="mx-2 text-slate-300">→</span>
                              <span className="font-mono text-xs text-indigo-600">{a.assistant_id}</span>
                            </div>
                            <span className="text-xs text-slate-400">{formatDateTime(a.assigned_at)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminPermissionGuard>
  );
}