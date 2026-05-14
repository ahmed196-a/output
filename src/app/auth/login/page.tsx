"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth-store";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { mutateAsync: login, isPending } = useLogin();
  const clearSession = useAuthStore((s) => s.clearSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isPostCheckout = searchParams.get("checkout") === "success";
  const sessionExpired = searchParams.get("reason") === "session_expired";

  const handleLogin = async () => {
    setErrorMessage(null);
    try {
      const response = await login({ email, password });
      // Role-aware redirect: admin roles go to /admin/overview, others to /dashboard
      const adminRoles = new Set([
        "super_admin",
        "operations",
        "support",
        "finance",
      ]);
      const defaultDest = adminRoles.has(response.user?.role ?? "")
        ? "/admin/overview"
        : "/dashboard";
      const next = searchParams.get("next");
      router.replace(next ?? defaultDest);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : "Login failed. Please verify your credentials."
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md rounded-xl border bg-white p-8 shadow-sm">
        {/* Post-checkout banner */}
        {isPostCheckout && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            ✅ Account created! Sign in with your new credentials to get started.
          </div>
        )}

        {/* Session expired banner */}
        {sessionExpired && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
            Your session expired. Please sign in again.
          </div>
        )}

        <h1 className="text-2xl font-semibold text-slate-900">Sign in</h1>
        <p className="mt-2 text-sm text-slate-600">
          Use your workspace credentials to access your dashboard.
        </p>

        <div className="mt-6 space-y-4" onKeyDown={handleKeyDown}>
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
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <button
            type="button"
            onClick={handleLogin}
            disabled={isPending || !email || !password}
            className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Signing in…" : "Continue"}
          </button>

          {errorMessage && (
            <p className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2 text-sm text-rose-600">
              {errorMessage}
            </p>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              clearSession();
              setEmail("");
              setPassword("");
              setErrorMessage(null);
            }}
            className="block w-full text-center text-sm text-slate-400 hover:text-slate-600 transition"
          >
            Clear local session
          </button>
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

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
