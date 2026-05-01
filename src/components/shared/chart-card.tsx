import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function ChartCard({ title, subtitle, children }: ChartCardProps) {
  return (
    <article
      className="rounded-2xl bg-white px-5 pt-5 pb-4"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="h-3 w-3 rounded-full" style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
        <h3
          className="text-sm font-semibold"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--foreground)" }}
        >
          {title}
        </h3>
      </div>
      {subtitle ? (
        <p className="text-xs mb-4 ml-5" style={{ color: "var(--subtle-text)" }}>{subtitle}</p>
      ) : <div className="mb-4" />}
      <div className="h-72">{children}</div>
    </article>
  );
}
