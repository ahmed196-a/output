"use client";

import { useMemo, useState, useRef } from "react";
import {
  Phone, Clock, DollarSign, Filter, Search, X,
  ChevronLeft, ChevronRight, User, AlertCircle, Loader2
} from "lucide-react";
import { useAdminCdrLogsQuery, AdminCdrLog } from "@/hooks/admin/use-admin-cdr-logs-query";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { ModalDrawerShell } from "@/components/shared/modal-drawer-shell";
import { formatDuration } from "@/utils/format";
import { parseDateSafe } from "@/utils/timezone";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type CallStatus = "passed" | "failed";
type SortOrder  = "newest" | "oldest";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getPresetRange(preset: string): { from: string; to: string } {
  const now   = new Date();
  const today = toDateStr(now);
  if (preset === "today") return { from: today, to: today };
  if (preset === "this_week") {
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return { from: toDateStr(mon), to: today };
  }
  if (preset === "this_month")
    return { from: toDateStr(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
  if (preset === "last_month") {
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last  = new Date(now.getFullYear(), now.getMonth(), 0);
    return { from: toDateStr(first), to: toDateStr(last) };
  }
  if (preset === "last_7") {
    const from = new Date(now);
    from.setDate(now.getDate() - 6);
    return { from: toDateStr(from), to: today };
  }
  if (preset === "last_30") {
    const from = new Date(now);
    from.setDate(now.getDate() - 29);
    return { from: toDateStr(from), to: today };
  }
  return { from: "", to: "" };
}

function getStatusVariant(status: CallStatus) {
  return status === "passed" ? ("success" as const) : ("danger" as const);
}

function getSentimentDisplay(sentiment: string | null) {
  const s = (sentiment ?? "").toLowerCase();
  if (s.includes("positive") || s.includes("happy") || s.includes("satisfied"))
    return { emoji: "😊", label: "Positive", color: "text-emerald-600 bg-emerald-50 border-emerald-100" };
  if (s.includes("negative") || s.includes("frustrated") || s.includes("angry") || s.includes("unhappy"))
    return { emoji: "😤", label: "Negative", color: "text-rose-600 bg-rose-50 border-rose-100" };
  if (s.includes("neutral"))
    return { emoji: "😐", label: "Neutral", color: "text-slate-600 bg-slate-100 border-slate-200" };
  if (sentiment)
    return { emoji: "🤔", label: sentiment, color: "text-amber-600 bg-amber-50 border-amber-100" };
  return null;
}

// ── Audio Player ──────────────────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying]       = useState(false);
  const [progress, setProgress]     = useState(0);
  const [duration, setDuration]     = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  function toggle() {
    const el = audioRef.current;
    if (!el) return;
    playing ? el.pause() : el.play();
    setPlaying(!playing);
  }

  function fmtTime(s: number) {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={() => {
          const el = audioRef.current;
          if (!el) return;
          setCurrentTime(el.currentTime);
          setProgress(el.duration ? (el.currentTime / el.duration) * 100 : 0);
        }}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => { setPlaying(false); setProgress(0); setCurrentTime(0); }}
        crossOrigin="anonymous"
        preload="metadata"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow transition hover:bg-slate-700 active:scale-95"
        >
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <rect x="1" y="1" width="4" height="10" rx="1" />
              <rect x="7" y="1" width="4" height="10" rx="1" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5z" />
            </svg>
          )}
        </button>
        <div className="flex flex-1 flex-col gap-1">
          <input
            type="range" min={0} max={100} value={progress}
            onChange={(e) => {
              const el = audioRef.current;
              if (!el) return;
              const t = (Number(e.target.value) / 100) * el.duration;
              el.currentTime = t;
              setCurrentTime(t);
              setProgress(Number(e.target.value));
            }}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>{fmtTime(currentTime)}</span>
            <span>{fmtTime(duration)}</span>
          </div>
        </div>
        <a
          href={url} download target="_blank" rel="noreferrer" title="Download"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── Call Detail Drawer ────────────────────────────────────────────────────────

function CallDetailDrawer({ log, onClose }: { log: AdminCdrLog; onClose: () => void }) {
  const sentiment      = getSentimentDisplay(log.customerSentiment ?? null);
  const transcriptSnip = log.transcript
    ? log.transcript.slice(0, 500) + (log.transcript.length > 500 ? "…" : "")
    : null;

  const metaItems = [
    { label: "Call ID",          value: log.callId },
    { label: "Date / Time",      value: parseDateSafe(log.startedAt) },
    { label: "Customer",         value: log.customerName ? `${log.customerName} (${log.customerEmail ?? ""})` : "—" },
    { label: "From (Customer)",  value: log.fromNumber },
    { label: "Agent (Assistant)", value: log.toNumber },
    { label: "Duration",         value: formatDuration(log.durationSeconds) },
    { label: "Status",           badge: log.status as CallStatus },
    ...(log.disconnectionReason ? [{ label: "Disconnect Reason", value: log.disconnectionReason }] : []),
  ];

  return (
    <ModalDrawerShell title="Call Details" open={true} onClose={onClose}>
      <div className="space-y-6 pb-4 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {metaItems.map(({ label, value, badge }) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
              {badge ? (
                <StatusBadge
                  text={badge.charAt(0).toUpperCase() + badge.slice(1)}
                  variant={getStatusVariant(badge)}
                />
              ) : (
                <p className="truncate font-medium text-slate-800">{value ?? "—"}</p>
              )}
            </div>
          ))}
        </div>

        {/* Recording */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recording</p>
          {log.recordingUrl ? (
            <AudioPlayer url={log.recordingUrl} />
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
              No recording available
            </div>
          )}
        </div>

        {/* Sentiment + Summary + Transcript */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sentiment & Analysis</p>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {sentiment ? (
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium ${sentiment.color}`}>
                  <span>{sentiment.emoji}</span>
                  <span>{sentiment.label}</span>
                </span>
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-500">
                  No sentiment data
                </span>
              )}
              {log.isSuccessful !== null && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${log.isSuccessful ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {log.isSuccessful ? "✓ Successful" : "✗ Unsuccessful"}
                </span>
              )}
            </div>
            {log.callInfo && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-400">Call Summary</p>
                <p className="text-xs leading-relaxed text-blue-800">{log.callInfo}</p>
              </div>
            )}
            {transcriptSnip && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Transcript Preview</p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{transcriptSnip}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalDrawerShell>
  );
}

// ── Main Shell ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export function AdminCdrLogsShell() {
  // Filters stored as state; actual fetch is done server-side via API
  const [customerId,  setCustomerId]  = useState("");
  const [search,      setSearch]      = useState("");
  const [status,      setStatus]      = useState<"all" | CallStatus>("all");
  const [datePreset,  setDatePreset]  = useState("all");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");
  const [sortOrder,   setSortOrder]   = useState<SortOrder>("newest");
  const [page,        setPage]        = useState(1);
  const [selectedLog, setSelectedLog] = useState<AdminCdrLog | null>(null);

  const effectiveDateRange = useMemo(() => {
    if (datePreset === "custom") return { from: customFrom, to: customTo };
    if (datePreset === "all")    return { from: "", to: "" };
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const queryParams = {
    customer_id: customerId || undefined,
    status:      status !== "all" ? status : undefined,
    from:        effectiveDateRange.from || undefined,
    to:          effectiveDateRange.to   || undefined,
    sort:        sortOrder,
    search:      search || undefined,
    page,
    limit:       PAGE_SIZE,
  };

  const { data: result, isLoading, error } = useAdminCdrLogsQuery(queryParams);

  const logs      = result?.data      ?? [];
  const total     = result?.total     ?? 0;
  const customers = result?.customers ?? [];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function resetPage() { setPage(1); }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs / CDR"
        description="All CDR records across every customer — filter by customer, status, date and more."
      />

      {/* ── Filter Bar ───────────────────────────────────────────────────── */}
      <div
        className="rounded-2xl bg-white p-4"
        style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">

          {/* Customer filter — admin-only extra */}
          <div className="flex items-center gap-2 rounded-xl border bg-violet-50 px-3 py-2 min-w-[180px]"
               style={{ border: "1px solid #ddd6fe" }}>
            <User className="h-4 w-4 shrink-0 text-violet-400" />
            <select
              value={customerId}
              onChange={(e) => { resetPage(); setCustomerId(e.target.value); }}
              className="w-full bg-transparent text-sm text-slate-700 outline-none cursor-pointer"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName || c.email}
                </option>
              ))}
            </select>
          </div>

          {/* Search by number */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { resetPage(); setSearch(e.target.value); }}
              placeholder="Search by number…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {search && (
              <button type="button" onClick={() => { resetPage(); setSearch(""); }} className="text-slate-400 hover:text-slate-700">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => { resetPage(); setStatus(e.target.value as "all" | CallStatus); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "#374151", background: "#f5f3ff" }}
          >
            <option value="all">All Statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
          </select>

          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => { resetPage(); setDatePreset(e.target.value); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "#374151", background: "#f5f3ff" }}
          >
            <option value="all">All Dates</option>
            <option value="today">Today</option>
            <option value="last_7">Last 7 Days</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_30">Last 30 Days</option>
            <option value="custom">Custom Range…</option>
          </select>

          {/* Sort */}
          <select
            value={sortOrder}
            onChange={(e) => { resetPage(); setSortOrder(e.target.value as SortOrder); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer"
            style={{ border: "1px solid var(--border)", color: "#374151", background: "#f5f3ff" }}
          >
            <option value="newest">↓ Newest First</option>
            <option value="oldest">↑ Oldest First</option>
          </select>

          {/* Custom date range pickers */}
          {datePreset === "custom" && (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" value={customFrom}
                onChange={(e) => { resetPage(); setCustomFrom(e.target.value); }}
                className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input type="date" value={customTo}
                onChange={(e) => { resetPage(); setCustomTo(e.target.value); }}
                className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          )}

          {/* Active date chip */}
          {effectiveDateRange.from && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              📅 {effectiveDateRange.from} → {effectiveDateRange.to || "today"}
            </span>
          )}
        </div>

        <p className="mt-2 text-xs text-slate-400">
          {isLoading ? "Loading…" : `${total} record${total !== 1 ? "s" : ""} found`}
        </p>
      </div>

      {/* ── Table / States ───────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-7 w-7 animate-spin text-slate-300" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-red-100 bg-red-50 py-20 text-center">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm text-red-600">{(error as Error).message}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-200 py-20 text-center">
          <Phone className="h-10 w-10 text-slate-300" />
          <p className="text-sm text-slate-400">No call logs match your filters.</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto rounded-2xl bg-white"
          style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
        >
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr style={{ background: "linear-gradient(90deg,#f5f3ff 0%,#eef2ff 100%)", borderBottom: "1px solid var(--border)" }}>
                {["Date / Time", "Customer", "From (Number)", "Duration", "Status", "Sentiment", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6366f1" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((log) => {
                const sentiment = getSentimentDisplay(log.customerSentiment ?? null);
                return (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600 text-xs">
                      {parseDateSafe(log.startedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {log.customerName ? (
                        <div>
                          <p className="font-medium text-slate-800 text-xs">{log.customerName}</p>
                          <p className="text-slate-400 text-xs">{log.customerEmail ?? ""}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{log.fromNumber}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDuration(log.durationSeconds)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        text={log.status.charAt(0).toUpperCase() + log.status.slice(1)}
                        variant={getStatusVariant(log.status)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      {sentiment ? (
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${sentiment.color}`}>
                          {sentiment.emoji} {sentiment.label}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition active:scale-95"
                        style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ───────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages} &nbsp;·&nbsp; {total} records
          </p>
          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm disabled:opacity-40 hover:bg-slate-50"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── Detail Drawer ────────────────────────────────────────────────── */}
      {selectedLog && (
        <CallDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
