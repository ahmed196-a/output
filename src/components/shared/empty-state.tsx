type EmptyStateProps = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed bg-slate-50 p-8 text-center">
      <h4 className="text-base font-semibold text-slate-800">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
