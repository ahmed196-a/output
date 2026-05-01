type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
};

export function PaginationControls({
  page, totalPages, onPrevious, onNext, className
}: PaginationControlsProps) {
  const isPreviousDisabled = page <= 1;
  const isNextDisabled = page >= totalPages;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl bg-white px-5 py-3 text-sm ${className ?? ""}`}
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      <span style={{ color: "var(--muted-text)" }}>
        Page <span className="font-semibold" style={{ color: "#6366f1" }}>{page}</span> of {totalPages}
      </span>
      <div className="flex items-center gap-2">
        <button
          className="rounded-xl px-4 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ border: "1px solid var(--border)", color: "#6366f1", background: "#f5f3ff" }}
          type="button"
          onClick={onPrevious}
          disabled={isPreviousDisabled}
        >
          ← Previous
        </button>
        <button
          className="rounded-xl px-4 py-1.5 text-xs font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: isPreviousDisabled && isNextDisabled ? "#cbd5e1" : "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          type="button"
          onClick={onNext}
          disabled={isNextDisabled}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
