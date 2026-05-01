"use client";

import { useState } from "react";
import { PauseCircle, PlayCircle, XCircle } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { useAdminSubscriptionsQuery, useSubscriptionAction } from "@/hooks/admin/use-admin-subscriptions-query";
import { AdminSubscription, SubscriptionAction } from "@/services/admin/adminSubscriptionsService";
import { formatDate } from "@/utils/format";

type ConfirmAction = { id: string; action: SubscriptionAction; userName: string };

function statusVariant(status: string) {
  if (status === "active") return "success";
  if (status === "canceled") return "danger";
  if (status === "past_due") return "warning";
  return "neutral";
}

function minutesPercent(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.round((used / total) * 100));
}

export function AdminSubscriptionsShell() {
  const { data: subscriptions = [], isLoading, error } = useAdminSubscriptionsQuery();
  const action = useSubscriptionAction();
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "canceled">("all");

  const filtered = subscriptions.filter((s) =>
    filter === "all" ? true : s.status === filter
  );

  async function handleConfirm() {
    if (!confirm) return;
    await action.mutateAsync({ id: confirm.id, action: confirm.action });
    setConfirm(null);
  }

  return (
    <AdminPermissionGuard allow={["subscriptions"]}>
      <div className="space-y-6">
        <PageHeader
          title="Subscriptions"
          description="View and manage all customer subscriptions."
        />

        {/* Filter tabs */}
        <div className="flex gap-2">
          {(["all", "active", "canceled"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-colors ${
                filter === f
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-96 w-full" />
        ) : error ? (
          <ErrorState message="Could not load subscriptions." />
        ) : filtered.length === 0 ? (
          <EmptyState title="No subscriptions" message="No subscriptions match this filter." />
        ) : (
          <div
            className="overflow-x-auto rounded-2xl bg-white"
            style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
          >
            <table className="min-w-full text-left">
              <thead>
                <tr style={{ background: "linear-gradient(90deg, #f5f3ff 0%, #eef2ff 100%)", borderBottom: "1px solid var(--border)" }}>
                  {["Customer", "Plan", "Status", "Usage", "Monthly", "Started", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "#6366f1" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((sub, i) => {
                  const pct = minutesPercent(sub.minutesUsed, sub.totalMinutes);
                  return (
                    <tr
                      key={sub.id}
                      style={{ borderTop: "1px solid var(--border-light)", background: i % 2 === 1 ? "#fafbff" : "white" }}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-800">{sub.userFullName}</p>
                        <p className="text-xs text-slate-400">{sub.userEmail}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{sub.planDisplayName}</td>
                      <td className="px-4 py-3">
                        <StatusBadge text={sub.status} variant={statusVariant(sub.status)} />
                      </td>
                      <td className="px-4 py-3 min-w-[140px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-indigo-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {sub.minutesUsed}/{sub.totalMinutes}m
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">${sub.monthlyPrice}</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{formatDate(sub.startedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {sub.status === "active" && (
                            <>
                              <button
                                title="Pause (cancel)"
                                onClick={() => setConfirm({ id: sub.id, action: "pause", userName: sub.userFullName })}
                                className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 transition-colors"
                              >
                                <PauseCircle className="h-4 w-4" />
                              </button>
                              <button
                                title="Terminate"
                                onClick={() => setConfirm({ id: sub.id, action: "terminate", userName: sub.userFullName })}
                                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          {sub.status === "canceled" && (
                            <button
                              title="Resume"
                              onClick={() => setConfirm({ id: sub.id, action: "resume", userName: sub.userFullName })}
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <PlayCircle className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirm Action Modal */}
      {confirm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900 capitalize">{confirm.action} Subscription</h3>
            <p className="text-sm text-slate-500">
              {confirm.action === "terminate"
                ? `This will permanently terminate ${confirm.userName}'s subscription. This cannot be undone.`
                : confirm.action === "pause"
                ? `This will cancel ${confirm.userName}'s subscription. You can resume it later.`
                : `This will reactivate ${confirm.userName}'s subscription.`}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={action.isPending}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  confirm.action === "terminate"
                    ? "bg-rose-600 hover:bg-rose-700"
                    : confirm.action === "pause"
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-emerald-600 hover:bg-emerald-700"
                }`}
              >
                {action.isPending ? "Processing…" : `Confirm ${confirm.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPermissionGuard>
  );
}