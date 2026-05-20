// src/components/billing/billing-shell.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { formatDate } from "@/utils/format";
import { CreditCard, Clock, Calendar, Zap } from "lucide-react";

type SubscriptionData = {
  subscription: {
    id: string;
    status: string;
    planName: string;
    startedAt: string;
    endsAt: string | null;
    cancelledAt: string | null;
    minutesUsed: number;
    totalMinutes: number | null;
    monthlyPrice: number;
    pricePerMinute: number;
  } | null;
  usageMinutes: number;
};

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "cancelled") return "danger";
  if (status === "past_due") return "warning";
  return "neutral";
}

function UsageBar({ used, total }: { used: number; total: number | null }) {
  const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const isHigh = pct >= 80;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{used} min used (CDR)</span>
        <span>{total ? `${total} min total` : "Unlimited"}</span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isHigh ? "bg-rose-500" : "bg-indigo-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {total && (
        <p className={`text-xs font-medium ${isHigh ? "text-rose-500" : "text-slate-400"}`}>
          {pct}% of plan used
        </p>
      )}
    </div>
  );
}

export function BillingShell() {
  const { data, isLoading, error } = useQuery<SubscriptionData>({
    queryKey: ["billing", "subscription"],
    queryFn: async () => {
      const res = await apiClient.get<SubscriptionData>("/billing/subscription");
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & Subscription"
        description="View your current plan, usage, and subscription details."
      />

      {isLoading ? (
        <LoadingSkeleton className="h-64 w-full" />
      ) : error ? (
        <ErrorState message="Could not load billing information." />
      ) : !data?.subscription ? (
        <EmptyState
          title="No active subscription"
          message="You don't have an active subscription. Contact your administrator."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Plan Card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-3"
            style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <CreditCard className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Plan</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{data.subscription.planName}</p>
            <p className="text-sm text-slate-500">
              ${data.subscription.monthlyPrice.toFixed(2)} / month
            </p>
            <StatusBadge
              text={data.subscription.status}
              variant={statusVariant(data.subscription.status)}
            />
          </div>

          {/* Usage Card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-3 sm:col-span-2"
            style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Clock className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Minutes Usage</span>
            </div>
            <UsageBar
              used={data.usageMinutes}
              total={data.subscription.totalMinutes}
            />
            {data.subscription.pricePerMinute > 0 && (
              <p className="text-xs text-slate-400">
                ${data.subscription.pricePerMinute.toFixed(4)} / min overage rate
              </p>
            )}
          </div>

          {/* Dates Card */}
          <div
            className="rounded-2xl bg-white p-5 space-y-3"
            style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2 text-indigo-600">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Dates</span>
            </div>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-slate-400">Started</p>
                <p className="text-sm font-medium text-slate-700">
                  {formatDate(data.subscription.startedAt)}
                </p>
              </div>
              {data.subscription.endsAt && (
                <div>
                  <p className="text-xs text-slate-400">Renews / Ends</p>
                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(data.subscription.endsAt)}
                  </p>
                </div>
              )}
              {data.subscription.cancelledAt && (
                <div>
                  <p className="text-xs text-slate-400">Cancelled</p>
                  <p className="text-sm font-medium text-rose-600">
                    {formatDate(data.subscription.cancelledAt)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Full-width detail row */}
          <div
            className="rounded-2xl bg-white p-5 sm:col-span-2 xl:col-span-4"
            style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
          >
            <div className="flex items-center gap-2 text-indigo-600 mb-4">
              <Zap className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Summary</span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <p className="text-xs text-slate-400">Plan</p>
                <p className="font-medium text-slate-800">{data.subscription.planName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Status</p>
                <StatusBadge
                  text={data.subscription.status}
                  variant={statusVariant(data.subscription.status)}
                />
              </div>
              <div>
                <p className="text-xs text-slate-400">Minutes Used (CDR)</p>
                <p className="font-medium text-slate-800">{data.usageMinutes} min</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">Plan Minutes</p>
                <p className="font-medium text-slate-800">
                  {data.subscription.totalMinutes ?? "—"} min
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}