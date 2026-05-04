"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { LogIn, Check, Zap, ArrowRight, Phone, Bot, BarChart3, Shield, Clock, Headphones } from "lucide-react";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_PRICE_IDS: Record<string, string> = {
  beginner:   process.env.NEXT_PUBLIC_STRIPE_PRICE_BEGINNER   ?? "",
  pro:        process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO        ?? "",
  enterprise: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE ?? "",
};

const PLAN_FEATURES: Record<string, { text: string; icon: any }[]> = {
  beginner: [
    { text: "200 AI call minutes/month", icon: Clock },
    { text: "1 active AI agent", icon: Bot },
    { text: "Call logs & basic summaries", icon: BarChart3 },
    { text: "Email support", icon: Headphones },
  ],
  pro: [
    { text: "800 AI call minutes/month", icon: Clock },
    { text: "Multi-step workflow automation", icon: Zap },
    { text: "CRM integrations (HubSpot, Zoho)", icon: Shield },
    { text: "Advanced analytics dashboard", icon: BarChart3 },
    { text: "Priority support", icon: Headphones },
  ],
  enterprise: [
    { text: "2,500 AI call minutes/month", icon: Clock },
    { text: "Dedicated AI voice agent", icon: Bot },
    { text: "End-to-end ticketing automation", icon: Zap },
    { text: "Custom dashboard & reporting", icon: BarChart3 },
    { text: "Dedicated success manager", icon: Headphones },
    { text: "SLA-backed uptime & support", icon: Shield },
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
  const [hoveredPlan, setHoveredPlan]   = useState<string | null>(null);

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
    <div style={{ minHeight: "100vh", background: "var(--background)", fontFamily: "'DM Sans', sans-serif" }}>

      {/* Top nav */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-light)",
        padding: "0 2rem",
        height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Phone size={16} color="white" />
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "var(--foreground)" }}>
            CallAutomate
          </span>
        </div>
        <Link href="/auth/login" style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: "var(--foreground)",
          color: "white",
          padding: "9px 20px",
          borderRadius: 10,
          fontSize: 14, fontWeight: 600,
          textDecoration: "none",
          transition: "opacity 0.2s",
        }}>
          <LogIn size={15} />
          Sign In
        </Link>
      </header>

      {/* Hero section */}
      <div style={{ position: "relative", overflow: "hidden", paddingTop: "80px", paddingBottom: "60px", textAlign: "center" }}>
        {/* Background mesh */}
        <div style={{
          position: "absolute", inset: 0, zIndex: 0,
          background: "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(99,102,241,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        {/* Floating orbs */}
        <div style={{
          position: "absolute", top: 40, left: "10%",
          width: 300, height: 300, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", top: 0, right: "8%",
          width: 250, height: 250, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />

        <div style={{ position: "relative", zIndex: 1, maxWidth: 640, margin: "0 auto", padding: "0 1.5rem" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "var(--brand-50)",
            border: "1px solid var(--brand-200)",
            borderRadius: 100,
            padding: "6px 16px",
            marginBottom: 28,
          }}>
            <Zap size={13} color="var(--brand-500)" fill="var(--brand-500)" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-600)" }}>
              AI-Powered Call Automation
            </span>
          </div>

          <h1 style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
            fontWeight: 800,
            color: "var(--foreground)",
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 20,
          }}>
            The right plan for{" "}
            <span style={{
              background: "linear-gradient(135deg, var(--brand-500) 0%, #8b5cf6 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              every team
            </span>
          </h1>

          <p style={{ fontSize: 18, color: "var(--muted-text)", lineHeight: 1.6, marginBottom: 16, maxWidth: 480, margin: "0 auto 16px" }}>
            Start automating calls in minutes. Scale as you grow. No hidden fees, no surprises.
          </p>

          <p style={{ fontSize: 14, color: "var(--subtle-text)", marginTop: 16 }}>
            Already subscribed?{" "}
            <Link href="/auth/login" style={{ color: "var(--brand-500)", fontWeight: 600, textDecoration: "none" }}>
              Sign in to your dashboard →
            </Link>
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ maxWidth: 700, margin: "0 auto 56px", padding: "0 1.5rem" }}>
        <div style={{
          background: "white",
          border: "1px solid var(--border-light)",
          borderRadius: 16,
          padding: "20px 32px",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          boxShadow: "var(--shadow-sm)",
        }}>
          {[
            { value: "99.9%", label: "Uptime SLA" },
            { value: "< 300ms", label: "Avg response time" },
            { value: "10k+", label: "Calls automated/day" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 22, fontWeight: 800,
                color: "var(--foreground)",
                letterSpacing: "-0.02em",
              }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: "var(--subtle-text)", marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Error state */}
      {fetchError && (
        <div style={{ maxWidth: 480, margin: "0 auto 32px", padding: "0 1.5rem" }}>
          <div style={{
            background: "var(--danger-bg)",
            border: "1px solid #fecdd3",
            borderRadius: 12,
            padding: "12px 20px",
            fontSize: 14, color: "var(--danger-fg)", textAlign: "center",
          }}>
            {fetchError}
          </div>
        </div>
      )}

      {/* Skeleton loader */}
      {loadingPlans && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 24, maxWidth: 1000, margin: "0 auto", padding: "0 1.5rem 80px",
        }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{
              background: "white", borderRadius: 24,
              padding: 28, border: "1px solid var(--border-light)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}>
              <div style={{ height: 14, background: "#f1f5f9", borderRadius: 8, width: "40%", marginBottom: 16 }} />
              <div style={{ height: 36, background: "#f1f5f9", borderRadius: 8, width: "55%", marginBottom: 24 }} />
              {[1, 2, 3, 4].map((j) => (
                <div key={j} style={{ height: 12, background: "#f1f5f9", borderRadius: 8, marginBottom: 10 }} />
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Plan cards */}
      {!loadingPlans && plans.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: 24,
          maxWidth: 1020,
          margin: "0 auto",
          padding: "0 1.5rem 80px",
          alignItems: "start",
        }}>
          {plans.map((plan) => {
            const features = PLAN_FEATURES[plan.name] ?? [];
            const pro = isPro(plan);
            const hovered = hoveredPlan === plan.name;

            return (
              <div
                key={plan.id}
                onMouseEnter={() => setHoveredPlan(plan.name)}
                onMouseLeave={() => setHoveredPlan(null)}
                style={{
                  position: "relative",
                  borderRadius: 24,
                  padding: pro ? "2px" : 0,
                  background: pro
                    ? "linear-gradient(135deg, var(--brand-500), #8b5cf6, var(--brand-500))"
                    : "transparent",
                  transition: "transform 0.25s ease, box-shadow 0.25s ease",
                  transform: hovered ? "translateY(-6px)" : "translateY(0)",
                  boxShadow: hovered
                    ? pro
                      ? "0 20px 60px rgba(99,102,241,0.3)"
                      : "0 20px 60px rgba(0,0,0,0.10)"
                    : pro
                      ? "0 8px 32px rgba(99,102,241,0.2)"
                      : "var(--shadow-sm)",
                }}
              >
                {/* Popular badge */}
                {pro && (
                  <div style={{
                    position: "absolute", top: -14, left: "50%",
                    transform: "translateX(-50%)",
                    background: "linear-gradient(135deg, var(--brand-500), #8b5cf6)",
                    color: "white",
                    fontSize: 12, fontWeight: 700,
                    padding: "5px 16px",
                    borderRadius: 100,
                    display: "flex", alignItems: "center", gap: 5,
                    whiteSpace: "nowrap",
                    boxShadow: "0 4px 12px rgba(99,102,241,0.4)",
                    zIndex: 10,
                  }}>
                    <Zap size={11} fill="white" /> Most Popular
                  </div>
                )}

                {/* Card inner */}
                <div style={{
                  background: pro ? "white" : "white",
                  borderRadius: pro ? 22 : 24,
                  border: pro ? "none" : "1px solid var(--border-light)",
                  padding: "32px 28px",
                  display: "flex", flexDirection: "column", gap: 0,
                  height: "100%",
                }}>
                  {/* Plan name & description */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 6,
                      background: pro ? "var(--brand-50)" : "var(--surface-2)",
                      borderRadius: 8, padding: "4px 10px", marginBottom: 12,
                    }}>
                      <span style={{
                        fontSize: 12, fontWeight: 700, letterSpacing: "0.04em",
                        color: pro ? "var(--brand-600)" : "var(--muted-text)",
                        textTransform: "uppercase",
                      }}>
                        {plan.display_name}
                      </span>
                    </div>
                    <p style={{ fontSize: 14, color: "var(--muted-text)", lineHeight: 1.5, margin: 0 }}>
                      {plan.description || "Automate your calls and scale your business."}
                    </p>
                  </div>

                  {/* Price */}
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, marginBottom: 24 }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      fontSize: 52, fontWeight: 800,
                      color: "var(--foreground)",
                      lineHeight: 1,
                      letterSpacing: "-0.04em",
                    }}>
                      ${plan.monthly_price.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 14, color: "var(--subtle-text)", paddingBottom: 8 }}>/month</span>
                  </div>

                  {/* Minutes highlight */}
                  <div style={{
                    background: pro ? "var(--brand-50)" : "var(--surface-2)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    marginBottom: 24,
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: pro ? "var(--brand-500)" : "var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Phone size={15} color={pro ? "white" : "var(--muted-text)"} />
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
                        {plan.total_minutes.toLocaleString()} minutes
                      </div>
                      <div style={{ fontSize: 12, color: "var(--subtle-text)" }}>
                        ${plan.price_per_minute.toFixed(4)}/extra min
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ height: 1, background: "var(--border-light)", marginBottom: 20 }} />

                  {/* Features */}
                  <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12, flex: 1, marginBottom: 28 }}>
                    {features.map(({ text, icon: Icon }) => (
                      <li key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: pro ? "var(--brand-50)" : "var(--success-bg)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={13} color={pro ? "var(--brand-500)" : "var(--success-fg)"} strokeWidth={2.5} />
                        </div>
                        <span style={{ fontSize: 14, color: "var(--muted-text)" }}>{text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA button */}
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loadingPlan === plan.name}
                    style={{
                      width: "100%",
                      padding: "14px 24px",
                      borderRadius: 12,
                      border: "none",
                      cursor: loadingPlan === plan.name ? "not-allowed" : "pointer",
                      opacity: loadingPlan === plan.name ? 0.6 : 1,
                      fontSize: 15, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                      transition: "all 0.2s ease",
                      background: pro
                        ? "linear-gradient(135deg, var(--brand-500), #8b5cf6)"
                        : "var(--foreground)",
                      color: "white",
                      boxShadow: pro ? "0 4px 20px rgba(99,102,241,0.35)" : "0 4px 12px rgba(0,0,0,0.15)",
                    }}
                  >
                    {loadingPlan === plan.name ? "Redirecting…" : (
                      <>
                        Get Started
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--border-light)",
        background: "rgba(255,255,255,0.7)",
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: "linear-gradient(135deg, var(--brand-500), var(--brand-700))",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Phone size={12} color="white" />
          </div>
          <span style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 700, fontSize: 14, color: "var(--foreground)",
          }}>CallAutomate</span>
        </div>
        <p style={{ fontSize: 12, color: "var(--subtle-text)", margin: 0 }}>
          © {new Date().getFullYear()} CallAutomate. All rights reserved.
        </p>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}