// src/components/settings/settings-shell.tsx
"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { KeyRound, Eye, EyeOff, CheckCircle2 } from "lucide-react";

function PasswordInput({
  label, value, onChange, placeholder
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-10 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function SettingsShell() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/user/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccess(true);
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setSuccess(false), 4000);
    },
    onError: (err: any) => {
      setFieldError(err?.response?.data?.error ?? "Something went wrong.");
    },
  });

  function handleSubmit() {
    setFieldError("");
    setSuccess(false);
    if (!current || !next || !confirm) {
      setFieldError("All fields are required."); return;
    }
    if (next.length < 8) {
      setFieldError("New password must be at least 8 characters."); return;
    }
    if (next !== confirm) {
      setFieldError("New passwords do not match."); return;
    }
    mutation.mutate();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your account security."
      />

      <div
        className="max-w-md rounded-2xl bg-white p-6 space-y-5"
        style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        <div className="flex items-center gap-2 text-indigo-600">
          <KeyRound className="h-4 w-4" />
          <span className="text-sm font-semibold">Change Password</span>
        </div>

        <PasswordInput label="Current Password" value={current} onChange={setCurrent} />
        <PasswordInput label="New Password" value={next} onChange={setNext} placeholder="Min. 8 characters" />
        <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} />

        {fieldError && (
          <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
            {fieldError}
          </p>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Password updated successfully.
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={mutation.isPending}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {mutation.isPending ? "Updating…" : "Update Password"}
        </button>
      </div>
    </div>
  );
}