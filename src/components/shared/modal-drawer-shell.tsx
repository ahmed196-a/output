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
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Clickable Backdrop Overlay */}
      <div
        className="absolute inset-0 bg-slate-900/55 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <aside className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
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
