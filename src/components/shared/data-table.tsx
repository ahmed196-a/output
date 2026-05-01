import type { ReactNode } from "react";

type Column<T> = {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => ReactNode;
};

type DataTableProps<T extends { id: string }> = {
  columns: Column<T>[];
  rows: T[];
};

export function DataTable<T extends { id: string }>({ columns, rows }: DataTableProps<T>) {
  return (
    <div
      className="overflow-x-auto rounded-2xl bg-white"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      <table className="min-w-full text-left">
        <thead>
          <tr style={{ background: "linear-gradient(90deg, #f5f3ff 0%, #eef2ff 100%)", borderBottom: "1px solid var(--border)" }}>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                style={{ color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.id}
              className="transition-colors duration-100"
              style={{
                borderTop: "1px solid var(--border-light)",
                background: i % 2 === 1 ? "#fafbff" : "white",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#f5f3ff")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 1 ? "#fafbff" : "white")}
            >
              {columns.map((column) => {
                const value = row[column.key];
                return (
                  <td
                    key={String(column.key)}
                    className="px-4 py-3 text-sm"
                    style={{ color: "#374151" }}
                  >
                    {column.render ? column.render(value, row) : String(value)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
