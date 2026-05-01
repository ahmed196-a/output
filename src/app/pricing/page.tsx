"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { LogIn, Check, Zap } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// Map plan names to Stripe price IDs — keep in sync with your Stripe dashboard
const STRIPE_PRICE_IDS: Record<string, string> = {
  beginner:   process.env.NEXT_PUBLIC_STRIPE_PRICE_BEGINNER   ?? "",
  pro:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO        ?? "",
  enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "",
};

// Plan-specific feature bullets (supplements DB data)
const PLAN_FEATURES: Record<string, string[]> = {
  beginner: [
    "500 AI call minutes/month",
    "1 active workflow",
    "Call logs & basic summaries",
    "Email support",
  ],
  pro: [
    "2,000 AI call minutes/month",
    "Multi-step workflow automation",
    "CRM integrations (HubSpot, Zoho)",
    "Advanced analytics dashboard",
    "Priority support",
  ],
  enterprise: [
    "8,000 AI call minutes/month",
    "Dedicated AI voice agent",
    "End-to-end ticketing automation",
    "Custom dashboard & reporting",
    "Dedicated success manager",
    "SLA-backed uptime & support",
  ],
};

interface Plan {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string;
}

export default function PricingPage() {
  const [plans, setPlans]               = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [fetchError, setFetchError]     = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans, error }) => {
        if (error) setFetchError(error);
        else setPlans(plans ?? []);
      })
      .catch(() => setFetchError("Could not load plans. Please refresh."))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCheckout = async (plan: Plan) => {
    const priceId = STRIPE_PRICE_IDS[plan.name];
    if (!priceId) {
      alert(`Stripe price ID for "${plan.display_name}" is not configured.`);
      return;
    }
    setLoadingPlan(plan.name);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, planId: plan.id, planName: plan.name }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setLoadingPlan(null);
    }
  };

  const isPro = (plan: Plan) => plan.name === "pro";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <span className="text-base font-semibold text-slate-900">VoiceOS</span>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:border-slate-300"
        >
          <LogIn className="h-4 w-4" />
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <div className="py-16 px-4 text-center">
        <span className="inline-block bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mb-4">
          Simple, transparent pricing
        </span>
        <h1 className="text-4xl font-bold text-slate-900 mb-3">Plans for every team</h1>
        <p className="text-slate-500 max-w-md mx-auto">
          Start lean, scale when you&apos;re ready. No hidden fees, no surprises.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Already subscribed?{" "}
          <Link href="/auth/login" className="text-blue-600 hover:underline font-medium">
            Sign in to your dashboard →
          </Link>
        </p>
      </div>

      {/* Error state */}
      {fetchError && (
        <div className="max-w-md mx-auto px-4 mb-8">
          <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600 text-center">
            {fetchError}
          </div>
        </div>
      )}

      {/* Skeleton loader */}
      {loadingPlans && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto px-4 pb-20">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-200 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-4" />
              <div className="h-8 bg-slate-100 rounded w-1/2 mb-6" />
              <div className="space-y-2">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="h-3 bg-slate-100 rounded w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan cards */}
      {!loadingPlans && plans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto px-4 pb-20">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl p-6 flex flex-col gap-5 relative ${
                isPro(plan)
                  ? "border-2 border-blue-500 shadow-md"
                  : "border border-slate-200"
              }`}
            >
              {isPro(plan) && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow">
                  <Zap className="w-3 h-3" /> Most popular
                </span>
              )}

              <div>
                <h2 className="text-xl font-bold text-slate-900">{plan.display_name}</h2>
                <p className="text-slate-500 text-sm mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">
                  ${plan.monthly_price.toFixed(0)}
                </span>
                <span className="text-slate-400 text-sm">/month</span>
              </div>

              {/* Key stats 
              <div className="bg-slate-50 rounded-xl px-4 py-3 flex flex-col gap-1">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Included</p>
                <p className="text-sm font-semibold text-slate-800">
                  {plan.total_minutes.toLocaleString()} minutes / month
                </p>
                <p className="text-xs text-slate-400">
                  ${plan.price_per_minute.toFixed(4)} per extra minute
                </p>
              </div>
                 */}
              <hr className="border-slate-100" />

              <ul className="flex flex-col gap-2 flex-1">
                {(PLAN_FEATURES[plan.name] ?? []).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2.5 h-2.5 text-green-600 stroke-[2.5]" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan)}
                disabled={loadingPlan === plan.name}
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${
                  isPro(plan)
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-200 text-slate-800 hover:bg-slate-50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingPlan === plan.name ? "Redirecting…" : "Get Started →"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
