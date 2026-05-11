"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { useAdminBillingQuery } from "@/hooks/admin/use-admin-billing-query";
import { AdminUserBilling } from "@/services/admin/adminBillingService";
import { formatDate } from "@/utils/format";

function minutesPercent(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

function subStatusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "canceled") return "danger";
  if (status === "past_due") return "warning";
  return "neutral";
}

function BillingCard({ user }: { user: AdminUserBilling }) {
  const sub = user.subscription;
  const pct = sub ? minutesPercent(user.usageMinutes, sub.totalMinutes) : 0;

  return (
    <div
      className="rounded-2xl bg-white p-5 flex flex-col gap-4"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
    >
      {/* User info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
          <p className="text-xs text-slate-400 truncate">{user.email}</p>
          <span className="mt-1 inline-block text-[10px] uppercase tracking-wide font-semibold text-indigo-500 bg-indigo-50 rounded px-1.5 py-0.5">
            {user.role}
          </span>
        </div>
        <StatusBadge
          text={user.isActive ? "Active" : "Inactive"}
          variant={user.isActive ? "success" : "neutral"}
        />
      </div>

      {/* CDR Usage — always shown */}
      <div className="flex items-center justify-between rounded-xl bg-indigo-50 px-3 py-2">
        <span className="text-xs font-medium text-indigo-600">CDR Usage (All-time)</span>
        <span className="text-sm font-bold text-indigo-700">{user.usageMinutes} min</span>
      </div>

      {sub ? (
        <>
          {/* Plan + subscription status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Plan</p>
              <p className="text-sm font-semibold text-slate-800">{sub.planName}</p>
            </div>
            <StatusBadge text={sub.status} variant={subStatusVariant(sub.status)} />
          </div>

          {/* Minutes usage bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Plan Minutes Used</span>
              <span>
                {user.usageMinutes} / {sub.totalMinutes} min ({pct}%)
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  pct >= 90
                    ? "bg-rose-500"
                    : pct >= 70
                    ? "bg-amber-400"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
            <div>
              <p className="text-xs text-slate-400">Monthly Price</p>
              <p className="text-sm font-bold text-slate-800">${sub.monthlyPrice.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Per Minute</p>
              <p className="text-sm font-bold text-slate-800">${sub.pricePerMinute.toFixed(6)}</p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div>
              <span className="text-slate-400">Started: </span>
              {formatDate(sub.startedAt)}
            </div>
            {sub.endsAt && (
              <div>
                <span className="text-slate-400">Ends: </span>
                {formatDate(sub.endsAt)}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400 text-center">
          No active subscription
        </div>
      )}
    </div>
  );
}

export function AdminBillingShell() {
  const { data: users = [], isLoading, error } = useAdminBillingQuery();
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPermissionGuard allow={["billing"]}>
      <div className="space-y-6">
        <PageHeader
          title="Billing"
          description="Subscription and billing overview for all customers."
        />

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-96 w-full" />
        ) : error ? (
          <ErrorState message="Could not load billing data." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No customers found" message="Try adjusting your search." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((user) => (
              <BillingCard key={user.userId} user={user} />
            ))}
          </div>
        )}
      </div>
    </AdminPermissionGuard>
  );
}