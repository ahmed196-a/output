import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CallLog, CallStatus } from "@/types/call-log";
import { formatDuration } from "@/utils/format";

function formatDateSafe(raw: string | null | undefined): string {
  if (!raw) return "—";
  const ts = Number(raw);
  const d = isNaN(ts) ? new Date(raw) : new Date(ts);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function getStatusVariant(status: CallStatus) {
  if (status === "passed") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "warning" as const;
}

type RecentCallLogsTableProps = {
  rows: CallLog[];
};

export function RecentCallLogsTable({ rows }: RecentCallLogsTableProps) {
  if (!rows.length) {
    return <p className="text-sm text-slate-400">No recent call logs.</p>;
  }

  return (
    <DataTable
      rows={rows}
      columns={[
        {
          key: "startedAt",
          label: "Date / Time",
          render: (value) => (
            <span className="whitespace-nowrap text-slate-700">
              {formatDateSafe(String(value))}
            </span>
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
              ? <span className="font-mono text-slate-700">${Number(value).toFixed(4)}</span>
              : <span className="text-slate-400">—</span>,
        },
      ]}
    />
  );
}
