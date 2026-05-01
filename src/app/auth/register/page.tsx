"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

// ─── n8n webhook URL ───────────────────────────────────────────────────────────

// ─── Helpers ───────────────────────────────────────────────────────────────────
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function validatePassword(pw: string): string | null {
  if (pw.length < 8)            return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw))        return "Include at least one uppercase letter.";
  if (!/[0-9]/.test(pw))        return "Include at least one number.";
  return null;
}

// ─── Inner component (uses useSearchParams) ────────────────────────────────────
function RegisterForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const sessionId = searchParams.get("session_id") ?? "";
  const planId    = searchParams.get("plan_id")    ?? "";
  const planName  = searchParams.get("plan_name")  ?? "";

  const [fullName,    setFullName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [showPass,    setShowPass]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [errorMsg,    setErrorMsg]    = useState<string | null>(null);
  const [success,     setSuccess]     = useState(false);

  // Guard: if there's no session_id the user landed here directly — redirect.
  useEffect(() => {
    if (!sessionId) {
      router.replace("/pricing");
    }
  }, [sessionId, router]);

  const handleSubmit = async () => {
    setErrorMsg(null);

    const trimmedName  = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName)  return setErrorMsg("Full name is required.");
    if (!trimmedEmail) return setErrorMsg("Email is required.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail))
      return setErrorMsg("Enter a valid email address.");

    const pwError = validatePassword(password);
    if (pwError) return setErrorMsg(pwError);
  
    // if (false) { }

    setSubmitting(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name:          trimmedName,
          email:              trimmedEmail,
          password,                          // n8n will hash this with bcrypt
          plan_id:            planId,
          plan_name:          planName,
          stripe_session_id:  sessionId,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? `Webhook returned ${res.status}.`);
      }

      setSuccess(true);

      // Give the user 2 s to read the success message, then go to sign-in
      setTimeout(() => {
        router.replace("/auth/login?checkout=success");
      }, 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !submitting) handleSubmit();
  };

  if (!sessionId) return null; // redirecting

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Account created!</h1>
          <p className="mt-2 text-sm text-slate-500">
            Redirecting you to sign in…
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">

        {/* Plan confirmation banner */}
        {planName && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            <span>
              Payment successful! You&apos;re on the{" "}
              <strong>{capitalize(planName)}</strong> plan.
            </span>
          </div>
        )}

        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Set up your credentials to access your dashboard.
        </p>

        <div className="mt-6 space-y-4" onKeyDown={handleKeyDown}>

          {/* Full name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Min 8 characters, one uppercase letter and one number.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600">
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !fullName || !email || !password}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Creating account…" : "Create account →"}
          </button>
        </div>

        <div className="mt-5">
          <Link
            href="/pricing"
            className="block text-center text-sm text-slate-400 hover:text-slate-600 transition"
          >
            ← Back to pricing
          </Link>
        </div>
      </section>
    </main>
  );
}

// ─── Page export — wrapped in Suspense for useSearchParams ────────────────────
export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
