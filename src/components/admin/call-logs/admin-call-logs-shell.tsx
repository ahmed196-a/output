"use client";

import { useState } from "react";
import { Phone, Clock, DollarSign, Loader2, AlertCircle, Download, Filter } from "lucide-react";
import { useAdminCallLogsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { useAdminRetellAgentsQuery } from "@/hooks/admin/use-admin-retell-agents-query";
import { CallLog } from "@/types/retell";
import { cn } from "@/lib/utils";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleString();
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ended:      "bg-green-100 text-green-700",
    ongoing:    "bg-blue-100 text-blue-700",
    registered: "bg-yellow-100 text-yellow-700",
    error:      "bg-red-100 text-red-700",
    unknown:    "bg-slate-100 text-slate-600",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", map[status] ?? map.unknown)}>
      {status}
    </span>
  );
}

function TranscriptModal({ log, onClose }: { log: CallLog; onClose: () => void }) {
  const turns = log.transcript_object ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Call Transcript</h2>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">{log.retell_call_id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-3">
          {turns.length > 0 ? turns.map((t, i) => (
            <div key={i} className={cn("flex gap-3", t.role === "agent" ? "justify-start" : "justify-end")}>
              <div className={cn(
                "max-w-[80%] rounded-lg px-4 py-2.5 text-sm",
                t.role === "agent"
                  ? "bg-slate-100 text-slate-800"
                  : "bg-slate-900 text-white"
              )}>
                <p className="text-xs font-medium mb-1 opacity-60 capitalize">{t.role}</p>
                <p>{t.content}</p>
              </div>
            </div>
          )) : log.transcript ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700">{log.transcript}</pre>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">No transcript available.</p>
          )}
        </div>
        <div className="border-t px-6 py-4">
          <button onClick={onClose} className="w-full rounded-lg bg-slate-100 py-2 text-sm hover:bg-slate-200">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminCallLogsShell() {
  const [filters, setFilters] = useState({ agent_id: "", status: "all" });
  const [page, setPage] = useState(1);
  const [transcript, setTranscript] = useState<CallLog | null>(null);

  const queryParams = {
    agent_id: filters.agent_id || undefined,
    status: filters.status !== "all" ? filters.status : undefined,
    page,
    limit: 50,
  };

  const { data, isLoading, error } = useAdminCallLogsQuery(queryParams);
  const { data: agents = [] } = useAdminRetellAgentsQuery();

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 50);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">Call Logs</h1>
        <p className="mt-1 text-sm text-slate-500">All calls received via Retell webhook — updated in real time.</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <select
            className="text-sm bg-transparent focus:outline-none"
            value={filters.agent_id}
            onChange={(e) => { setFilters((p) => ({ ...p, agent_id: e.target.value })); setPage(1); }}
          >
            <option value="">All Agents</option>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <select
            className="text-sm bg-transparent focus:outline-none"
            value={filters.status}
            onChange={(e) => { setFilters((p) => ({ ...p, status: e.target.value })); setPage(1); }}
          >
            <option value="all">All Statuses</option>
            <option value="ended">Ended</option>
            <option value="ongoing">Ongoing</option>
            <option value="registered">Registered</option>
            <option value="error">Error</option>
          </select>
        </div>
        <span className="ml-auto text-sm text-slate-400">{total} total</span>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-slate-200 py-20 text-center">
          <Phone className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">No call logs found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left">
                  <th className="px-4 py-3 font-medium text-slate-600">Call ID</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Agent</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Status</th>
                  <th className="px-4 py-3 font-medium text-slate-600">From</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Started</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Duration</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Cost</th>
                  <th className="px-4 py-3 font-medium text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 max-w-[120px] truncate">
                      {log.retell_call_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {(log.agent as { name?: string })?.name ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={log.call_status} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{log.from_number ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {formatTimestamp(log.start_timestamp)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDuration(log.duration_seconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {log.call_cost != null ? (
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                          {Number(log.call_cost).toFixed(4)}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(log.transcript || log.transcript_object) && (
                          <button
                            onClick={() => setTranscript(log)}
                            className="text-xs text-slate-500 underline hover:text-slate-800"
                          >
                            Transcript
                          </button>
                        )}
                        {log.recording_url && (
                          <a
                            href={log.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                          >
                            <Download className="h-3.5 w-3.5" /> Recording
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-slate-500">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {transcript && (
        <TranscriptModal log={transcript} onClose={() => setTranscript(null)} />
      )}
    </div>
  );
}
