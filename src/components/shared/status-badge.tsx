import { cn } from "@/lib/utils";

export type StatusVariant = "success" | "warning" | "danger" | "neutral";

type StatusBadgeProps = {
  text: string;
  variant?: StatusVariant;
};

const variantStyles: Record<StatusVariant, { bg: string; color: string; dot: string }> = {
  success: { bg: "#ecfdf5", color: "#059669", dot: "#10b981" },
  warning: { bg: "#fffbeb", color: "#d97706", dot: "#f59e0b" },
  danger:  { bg: "#fff1f2", color: "#e11d48", dot: "#fb7185" },
  neutral: { bg: "#f0f2f8", color: "#6366f1", dot: "#818cf8" },
};

export function StatusBadge({ text, variant = "neutral" }: StatusBadgeProps) {
  const s = variantStyles[variant];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span className="h-1.5 w-1.5 rounded-full inline-block" style={{ background: s.dot }} />
      {text}
    </span>
  );
}
