import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-2xl px-6 py-5 md:flex-row md:items-center md:justify-between relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
        boxShadow: "0 4px 20px rgba(99,102,241,0.28)"
      }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-10"
        style={{ background: "white" }}
      />
      <div
        className="absolute -right-2 top-6 h-16 w-16 rounded-full opacity-10"
        style={{ background: "white" }}
      />

      <div className="relative">
        <h2
          className="text-xl font-bold text-white"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.72)" }}>
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="relative">{action}</div> : null}
    </div>
  );
}
