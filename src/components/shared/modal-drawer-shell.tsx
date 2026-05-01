import type { ReactNode } from "react";

type ModalDrawerShellProps = {
  title: string;
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
};

export function ModalDrawerShell({ title, open, onClose, children }: ModalDrawerShellProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-black/30">
      <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-md border px-2 py-1 text-sm">
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </aside>
    </div>
  );
}
