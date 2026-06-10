// src/components/settings/settings-shell.tsx
"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { KeyRound, Eye, EyeOff, CheckCircle2, User, Mail, Pencil } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

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

function TextInput({
  label, value, onChange, placeholder, type = "text"
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition"
      />
    </div>
  );
}

type TabId = "profile" | "password";

export function SettingsShell() {
  const user = useAuthStore((s) => s.user);
  const setSession = useAuthStore((s) => s.setSession);
  const accessToken = useAuthStore((s) => s.accessToken);
  const expiresAt = useAuthStore((s) => s.expiresAt);

  const [activeTab, setActiveTab] = useState<TabId>("profile");

  // Profile tab state
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");

  // Password tab state
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    setFullName(user?.fullName ?? "");
    setEmail(user?.email ?? "");
  }, [user]);

  const profileMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.patch("api/user/profile", { fullName, email });
      return res.data;
    },
    onSuccess: () => {
      setProfileSuccess(true);
      setProfileError("");
      // Update auth store so header/name reflects new info immediately
      if (user && accessToken && expiresAt) {
        setSession({
          accessToken,
          expiresAt,
          user: { ...user, fullName, email },
        });
      }
      setTimeout(() => setProfileSuccess(false), 4000);
    },
    onError: (err: any) => {
      setProfileError(err?.response?.data?.error ?? err?.message ?? "Something went wrong.");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("api/user/change-password", {
        currentPassword: current,
        newPassword: next,
      });
      return res.data;
    },
    onSuccess: () => {
      setPwSuccess(true);
      setPwError("");
      setCurrent(""); setNext(""); setConfirm("");
      setTimeout(() => setPwSuccess(false), 4000);
    },
    onError: (err: any) => {
      setPwError(err?.response?.data?.error ?? err?.message ?? "Something went wrong.");
    },
  });

  function handleProfileSubmit() {
    setProfileError("");
    setProfileSuccess(false);
    if (!fullName.trim()) {
      setProfileError("Name is required."); return;
    }
    if (!email.trim() || !email.includes("@")) {
      setProfileError("A valid email is required."); return;
    }
    profileMutation.mutate();
  }

  function handlePasswordSubmit() {
    setPwError("");
    setPwSuccess(false);
    if (!current || !next || !confirm) {
      setPwError("All fields are required."); return;
    }
    if (next.length < 8) {
      setPwError("New password must be at least 8 characters."); return;
    }
    if (next !== confirm) {
      setPwError("New passwords do not match."); return;
    }
    passwordMutation.mutate();
  }

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Edit Profile", icon: <User className="h-4 w-4" /> },
    { id: "password", label: "Change Password", icon: <KeyRound className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile and account security."
      />

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 max-w-sm">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-indigo-700 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Edit Profile Panel */}
      {activeTab === "profile" && (
        <div
          className="max-w-md rounded-2xl bg-white p-6 space-y-5"
          style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
        >
          <div className="flex items-center gap-2 text-indigo-600">
            <Pencil className="h-4 w-4" />
            <span className="text-sm font-semibold">Edit Profile</span>
          </div>

          <TextInput
            label="Full Name"
            value={fullName}
            onChange={setFullName}
            placeholder="Your full name"
          />
          <TextInput
            label="Email Address"
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
            type="email"
          />

          {profileError && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
              {profileError}
            </p>
          )}

          {profileSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Profile updated successfully.
            </div>
          )}

          <button
            onClick={handleProfileSubmit}
            disabled={profileMutation.isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {profileMutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      )}

      {/* Change Password Panel */}
      {activeTab === "password" && (
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

          {pwError && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-600">
              {pwError}
            </p>
          )}

          {pwSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Password updated successfully.
            </div>
          )}

          <button
            onClick={handlePasswordSubmit}
            disabled={passwordMutation.isPending}
            className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {passwordMutation.isPending ? "Updating…" : "Update Password"}
          </button>
        </div>
      )}
    </div>
  );
}
