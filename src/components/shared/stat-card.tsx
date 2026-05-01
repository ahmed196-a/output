import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  change?: string;
};

// Cycle through accent color schemes per card
const accents = [
  { icon: "bg-indigo-100 text-indigo-600",   bar: "from-indigo-400 to-violet-400" },
  { icon: "bg-emerald-100 text-emerald-600", bar: "from-emerald-400 to-teal-400" },
  { icon: "bg-rose-100 text-rose-600",       bar: "from-rose-400 to-pink-400" },
  { icon: "bg-amber-100 text-amber-600",     bar: "from-amber-400 to-orange-400" },
  { icon: "bg-cyan-100 text-cyan-600",       bar: "from-cyan-400 to-sky-400" },
];

let _counter = 0;

export function StatCard({ label, value, change }: StatCardProps) {
  const positive = change?.startsWith("+");
  const negative = change?.startsWith("-");
  const accent = accents[_counter++ % accents.length];

  return (
    <article
      className="rounded-2xl bg-white px-5 pt-5 pb-4 flex flex-col gap-1 relative overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      {/* Top gradient bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${accent.bar} opacity-70`} />

      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "var(--subtle-text)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {label}
      </p>
      <p
        className="text-2xl font-bold mt-1"
        style={{ color: "var(--foreground)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        {value}
      </p>
      {change ? (
        <p className={cn(
          "text-xs font-medium mt-1",
          positive && "text-emerald-600",
          negative && "text-rose-500",
          !positive && !negative && "text-slate-400"
        )}>
          {change}
        </p>
      ) : null}
    </article>
  );
}
