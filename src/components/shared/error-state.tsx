type ErrorStateProps = {
  title?: string;
  message: string;
};

export function ErrorState({ title = "Something went wrong", message }: ErrorStateProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
      <h4 className="text-base font-semibold text-rose-800">{title}</h4>
      <p className="mt-1 text-sm text-rose-700">{message}</p>
    </div>
  );
}
