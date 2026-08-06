"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Check, Zap, ArrowRight, Phone, Loader2 } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";

interface Plan {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string;
  stripe_price_id: string | null;
  features: string[];
  is_featured: boolean;
}

export function LandingPricing() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then(({ plans, error }) => {
        if (error) setFetchError(error);
        else setPlans(plans ?? []);
      })
      .catch(() => setFetchError("Could not load pricing plans."))
      .finally(() => setLoadingPlans(false));
  }, []);

  const handleCheckout = async (plan: Plan) => {
    if (!plan.stripe_price_id) {
      alert(`Stripe price for "${plan.display_name}" is not configured. Redirecting to registration.`);
      window.location.href = "/auth/register";
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          planId: plan.id,
          planName: plan.name,
        }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setLoadingPlanId(null);
    }
  };

  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            <span>Simple Transparent Pricing</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
            Flexible plans for every business
          </h2>
          <p className="text-slate-400 text-lg">
            Includes 30-Day Free Trial. Upgrade, downgrade, or cancel anytime.
          </p>
        </div>

        {fetchError && (
          <div className="max-w-md mx-auto mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-center text-sm font-semibold">
            {fetchError}
          </div>
        )}

        {loadingPlans && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        )}

        {!loadingPlans && plans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {plans.map((plan) => {
              const featured = plan.is_featured;

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl p-8 transition-all duration-300 flex flex-col justify-between ${
                    featured
                      ? "bg-slate-800 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-[1.03]"
                      : "bg-slate-950/80 border border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {featured && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[11px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white uppercase tracking-wider">{plan.display_name}</h3>
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-indigo-400 flex items-center justify-center">
                        <Phone className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                      {plan.description || "Automate your customer phone calls with voice AI."}
                    </p>

                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-5xl font-black text-white tracking-tight">${plan.monthly_price}</span>
                      <span className="text-slate-400 text-sm font-medium">/month</span>
                    </div>

                    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 mb-6 flex items-center gap-3">
                      <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                      <div>
                        <div className="text-sm font-bold text-white">
                          {plan.total_minutes.toLocaleString()} included minutes
                        </div>
                        <div className="text-[11px] text-slate-400">
                          ${plan.price_per_minute.toFixed(4)}/extra min
                        </div>
                      </div>
                    </div>

                    {plan.features.length > 0 && (
                      <ul className="space-y-3 mb-8">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                            <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlanId === plan.id}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      featured
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                    }`}
                  >
                    {loadingPlanId === plan.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>Get Started</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
