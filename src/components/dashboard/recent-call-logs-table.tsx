import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { CallLog, CallStatus } from "@/types/call-log";
import { formatDuration } from "@/utils/format";

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

  // ✅ Sort ascending by startedAt
  const sortedRows = [...rows].sort((a, b) => {
    const getTime = (val: string | null | undefined) => {
      if (!val) return 0;

      const ts = Number(val);

      if (!isNaN(ts)) return ts;

      if (val.includes("/")) {
        const [datePart, timePart] = val.split(",").map(s => s.trim());
        const [day, month, year] = datePart.split("/");
        return new Date(`${year}-${month}-${day}T${timePart || "00:00:00"}`).getTime();
      }

      return new Date(val).getTime();
    };

    return getTime(a.startedAt) - getTime(b.startedAt); // ascending
  });

  return (
    <DataTable
      rows={sortedRows} // 👈 use sorted rows
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
              ? <span className="font-mono text-slate-700">${Number(value).toFixed(2)}</span>
              : <span className="text-slate-400">—</span>,
        },
      ]}
    />
  );
}