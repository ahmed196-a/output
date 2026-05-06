"use client";

import { useMemo, useState, useRef } from "react";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ModalDrawerShell } from "@/components/shared/modal-drawer-shell";
import { PageHeader } from "@/components/shared/page-header";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { StatusBadge } from "@/components/shared/status-badge";
import { useCallLogsQuery } from "@/hooks/use-call-logs-query";
import { CallLog, CallStatus } from "@/types/call-log";
import { formatDuration } from "@/utils/format";
// import dayjs from "dayjs";

const PAGE_SIZE = 10;

// ── helpers ──────────────────────────────────────────────────────────────────
// function formatDateSafe2(value) {
//   return dayjs(value, "DD/MM/YYYY HH:mm:ss").format("DD MMM YYYY, HH:mm");
// }

function getStatusVariant(status: CallStatus) {
  if (status === "passed") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";

  const ts = Number(raw);

  let d: Date;

  if (!isNaN(ts)) {
    d = new Date(ts);
  } else if (raw.includes("/")) {
    // 👉 Handle DD/MM/YYYY manually
    const [datePart, timePart] = raw.split(",").map(s => s.trim());
    const [day, month, year] = datePart.split("/");

    const iso = `${year}-${month}-${day}T${timePart || "00:00:00"}`;
    d = new Date(iso);
  } else {
    d = new Date(raw);
  }

  if (isNaN(d.getTime())) return "—";

  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getPresetRange(preset: string): { from: string; to: string } {
  const now = new Date();
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
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
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

// ── AudioPlayer ───────────────────────────────────────────────────────────────

function AudioPlayer({ url }: { url: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
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
              <rect x="1" y="1" width="4" height="10" rx="1"/>
              <rect x="7" y="1" width="4" height="10" rx="1"/>
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M2 1.5l9 4.5-9 4.5z"/>
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
          href={url} download target="_blank" rel="noreferrer"
          title="Download MP3"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition"
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 1.5v7M3.5 6l3 3 3-3M1.5 11.5h10" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </a>
      </div>
    </div>
  );
}

// ── CallDetailDrawer ──────────────────────────────────────────────────────────

function CallDetailDrawer({ log, onClose }: { log: CallLog; onClose: () => void }) {
  const sentiment = getSentimentDisplay(log.customerSentiment);
  const transcriptSnippet = log.transcript
    ? log.transcript.slice(0, 500) + (log.transcript.length > 500 ? "…" : "")
    : null;

  const metaItems: { label: string; value?: string | null; badge?: CallStatus }[] = [
    { label: "Call ID", value: log.callId },
    { label: "Date / Time", value: formatDateSafe(log.startedAt) },
    { label: "From (Customer)", value: log.fromNumber },
    { label: "Agent ID", value: log.toNumber },
    { label: "Duration", value: formatDuration(log.durationSeconds) },
    { label: "Status", badge: log.status },
    ...(log.cost !== null ? [{ label: "Cost", value: `$${Number(log.cost).toFixed(4)}` }] : []),
    ...(log.disconnectionReason ? [{ label: "Disconnect Reason", value: log.disconnectionReason }] : []),
  ];

  return (
    <ModalDrawerShell title="Call Details" open={true} onClose={onClose}>
      <div className="space-y-6 pb-4 text-sm">

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2">
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
              No recording available for this call
            </div>
          )}
        </div>

        {/* Sentiment Analysis */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Sentiment Analysis</p>
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
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  log.isSuccessful ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                }`}>
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

            {transcriptSnippet && (
              <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Transcript Preview</p>
                <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700">{transcriptSnippet}</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </ModalDrawerShell>
  );
}

// ── Main Shell ────────────────────────────────────────────────────────────────

export function CallLogsShell() {
  const { data: callLogs = [], isLoading, error } = useCallLogsQuery();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CallStatus>("all");
  const [datePreset, setDatePreset] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<CallLog | null>(null);

  const effectiveDateRange = useMemo(() => {
    if (datePreset === "custom") return { from: customFrom, to: customTo };
    if (datePreset === "all") return { from: "", to: "" };
    return getPresetRange(datePreset);
  }, [datePreset, customFrom, customTo]);

  const filteredLogs = useMemo(() => {
    return callLogs.filter((log) => {
      const q = query.trim().toLowerCase();
      const queryMatch = !q || log.fromNumber.toLowerCase().includes(q) || log.toNumber.toLowerCase().includes(q);
      const statusMatch = statusFilter === "all" || log.status === statusFilter;

      let dateMatch = true;
      if (effectiveDateRange.from || effectiveDateRange.to) {
        const raw = log.startedAt;
        const ts = Number(raw);
        const d = !isNaN(ts) && raw !== "" ? new Date(ts) : new Date(raw);
        if (!isNaN(d.getTime())) {
          const logDate = toDateStr(d);
          if (effectiveDateRange.from && logDate < effectiveDateRange.from) dateMatch = false;
          if (effectiveDateRange.to && logDate > effectiveDateRange.to) dateMatch = false;
        }
      }

      return queryMatch && statusMatch && dateMatch;
    });
  }, [callLogs, query, statusFilter, effectiveDateRange]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const pagedLogs = filteredLogs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function resetPage() { setPage(1); }

  if (isLoading) return <LoadingSkeleton className="h-96 w-full" />;
  if (error) return <ErrorState message="Call logs could not be loaded. Please try again." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Call Logs / CDR"
        description="Complete call history with filters, searchable CDR fields, and call detail drawer."
      />

      {/* Filter Bar */}
      <div className="rounded-2xl bg-white p-4" style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}>
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">

          {/* Search */}
          <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-slate-400">
              <circle cx="6" cy="6" r="4.5"/>
              <path d="M9.5 9.5l3 3" strokeLinecap="round"/>
            </svg>
            <input
              value={query}
              onChange={(e) => { resetPage(); setQuery(e.target.value); }}
              placeholder="Search by number…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {query && (
              <button type="button" onClick={() => { resetPage(); setQuery(""); }} className="text-slate-400 hover:text-slate-700">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 1l10 10M11 1L1 11" strokeLinecap="round"/>
                </svg>
              </button>
            )}
          </div>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => { resetPage(); setStatusFilter(e.target.value as "all" | CallStatus); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer" style={{ border: "1px solid var(--border)", color: "#374151", background: "#f5f3ff" }}
          >
            <option value="all">All Statuses</option>
            <option value="passed">Passed</option>
            <option value="failed">Failed</option>
            <option value="missed">Missed</option>
          </select>

          {/* Date preset */}
          <select
            value={datePreset}
            onChange={(e) => { resetPage(); setDatePreset(e.target.value); }}
            className="rounded-xl px-3 py-2 text-sm font-medium cursor-pointer" style={{ border: "1px solid var(--border)", color: "#374151", background: "#f5f3ff" }}
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

          {/* Custom range pickers */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date" value={customFrom}
                onChange={(e) => { resetPage(); setCustomFrom(e.target.value); }}
                className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date" value={customTo}
                onChange={(e) => { resetPage(); setCustomTo(e.target.value); }}
                className="rounded-lg border bg-slate-50 px-3 py-2 text-sm text-slate-700"
              />
            </div>
          )}

          {/* Active date range chip */}
          {effectiveDateRange.from && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="1" y="2" width="8" height="7" rx="1"/>
                <path d="M3 1v2M7 1v2M1 5h8" strokeLinecap="round"/>
              </svg>
              {effectiveDateRange.from} → {effectiveDateRange.to || "today"}
            </span>
          )}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          {filteredLogs.length} record{filteredLogs.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Table */}
      {pagedLogs.length === 0 ? (
        <EmptyState title="No call logs found" message="Try adjusting your filters or search query." />
      ) : (
        <DataTable
          rows={pagedLogs}
          columns={[
            {
              key: "startedAt",
              label: "Date / Time",
              render: (value) => (
                <span className="whitespace-nowrap text-slate-700">{formatDateSafe(String(value))}</span>
              ),
            },
            {
              key: "fromNumber",
              label: "From",
              render: (value) => (
                <span className="font-mono text-sm">{String(value) || "—"}</span>
              ),
            },
            {
              key: "durationSeconds",
              label: "Duration",
              render: (value) => (
                <span className="whitespace-nowrap">{formatDuration(Number(value))}</span>
              ),
            },
            {
              key: "status",
              label: "Status",
              render: (value) => (
                <StatusBadge
                  text={String(value).charAt(0).toUpperCase() + String(value).slice(1)}
                  variant={getStatusVariant(value as CallStatus)}
                />
              ),
            },
            {
              key: "cost",
              label: "Cost",
              render: (value) =>
                value !== null && value !== undefined
                  ? <span className="font-mono text-slate-700">${Number(value).toFixed(2)}</span>
                  : <span className="text-slate-400">—</span>,
            },
            {
              key: "id",
              label: "Call Details",
              render: (_v, row) => (
                <button
                  type="button"
                  onClick={() => setSelectedLog(row)}
                  className="rounded-lg px-3 py-1 text-xs font-semibold text-white transition active:scale-95" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  View Details
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

      {selectedLog && (
        <CallDetailDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
