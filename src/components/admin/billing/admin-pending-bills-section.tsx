// src/components/admin/billing/admin-pending-bills-section.tsx
"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, ChevronUp,
  Download, FileText, Receipt, Search, XCircle,
} from "lucide-react";
import { formatDate } from "@/utils/format";

type PendingBill = {
  invoiceId: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "past_due";
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  planName: string;
  invoiceStatus: "pending" | "paid" | "waived";
  periodStart: string;
  periodEnd: string | null;
  allocatedMinutes: number;
  usedMinutes: number;
  overageMinutes: number;
  pricePerMinute: number;
  overageAmount: number;
  monthlyPrice: number;
  generatedAt: string;
};

type PendingBillsResponse = {
  pendingBills: PendingBill[];
};

function SubscriptionStatusPill({ status }: { status: string }) {
  if (status === "active") {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600 uppercase tracking-wide">
        Sub Active
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
      {status}
    </span>
  );
}

function useInvoiceAction(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action: "mark_paid" | "waive_off") => {
      const res = await fetch(`/api/admin/billing/pending-bills/${invoiceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error("Action failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "billing", "pending-bills"] });
    },
  });
}

function AdminInvoiceRow({ bill }: { bill: PendingBill }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = bill.subscriptionStatus === "active";
  const { mutate: doAction, isPending } = useInvoiceAction(bill.invoiceId);

  const handleDownload = () => {
    // Build a simple text invoice and trigger download
    const lines = [
      `OVERAGE INVOICE`,
      `Invoice ID: ${bill.invoiceId}`,
      `Generated: ${formatDate(bill.generatedAt)}`,
      ``,
      `Customer: ${bill.userName} (${bill.userEmail})`,
      `Plan: ${bill.planName}`,
      `Period: ${formatDate(bill.periodStart)} → ${bill.periodEnd ? formatDate(bill.periodEnd) : "present"}`,
      ``,
      `Plan Minutes: ${bill.allocatedMinutes}`,
      `Minutes Used: ${bill.usedMinutes}`,
      `Overage Minutes: ${bill.overageMinutes}`,
      `Rate: $${bill.pricePerMinute.toFixed(4)}/min`,
      ``,
      `AMOUNT DUE: $${bill.overageAmount.toFixed(2)}`,
      `Status: PENDING`,
    ].join("\n");

    const blob = new Blob([lines], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${bill.invoiceId.slice(-8).toUpperCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <tr
        className="transition-colors hover:bg-rose-50/40"
        style={{
          borderBottom: "1px solid var(--border-light)",
          background: isActive ? "rgba(234,179,8,0.02)" : undefined,
        }}
      >
        {/* User */}
        <td className="px-5 py-3.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <div>
            <p className="text-sm font-semibold text-slate-800">{bill.userName}</p>
            <p className="text-xs text-slate-400">{bill.userEmail}</p>
          </div>
        </td>
        {/* Plan */}
        <td className="px-5 py-3.5 text-sm text-slate-600 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          {bill.planName}
        </td>
        {/* Sub status */}
        <td className="px-5 py-3.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <SubscriptionStatusPill status={bill.subscriptionStatus} />
        </td>
        {/* Period */}
        <td className="px-5 py-3.5 text-xs text-slate-500 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <div>{formatDate(bill.periodStart)}</div>
          <div className="text-slate-400">
            → {bill.periodEnd ? formatDate(bill.periodEnd) : "present"}
          </div>
        </td>
        {/* Overage */}
        <td className="px-5 py-3.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <span className="text-sm font-semibold text-rose-600">
            +{bill.overageMinutes} min
          </span>
          <div className="text-xs text-slate-400">
            {bill.allocatedMinutes} alloc / {bill.usedMinutes} used
          </div>
        </td>
        {/* Amount */}
        <td className="px-5 py-3.5 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          <span className="text-base font-bold text-rose-600">
            ${bill.overageAmount.toFixed(2)}
          </span>
        </td>
        {/* Actions */}
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            {/* Download */}
            <button
              onClick={handleDownload}
              title="Download Invoice"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Download</span>
            </button>
            {/* Mark as Paid */}
            <button
              disabled={isPending}
              onClick={() => doAction("mark_paid")}
              title="Mark as Paid"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-emerald-700 transition-colors hover:bg-emerald-50 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Mark Paid</span>
            </button>
            {/* Waive Off */}
            <button
              disabled={isPending}
              onClick={() => doAction("waive_off")}
              title="Waive Off Invoice"
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Waive Off</span>
            </button>
          </div>
        </td>
        {/* Expand toggle */}
        <td className="px-3 py-3.5 text-slate-400 cursor-pointer" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </td>
      </tr>

      {/* Expanded detail */}
      {expanded && (
        <tr style={{ background: "rgba(239,68,68,0.03)", borderBottom: "1px solid var(--border-light)" }}>
          <td colSpan={8} className="px-5 py-4">
            {isActive && (
              <div
                className="flex items-start gap-2 rounded-xl mb-3 px-4 py-2.5 text-xs text-amber-700"
                style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)" }}
              >
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>
                  This customer's subscription is <strong>still active</strong> — the overage amount
                  updates automatically as they continue making calls.
                </span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {/* Calculation */}
              <div className="rounded-xl bg-white p-4 space-y-2" style={{ border: "1px solid var(--border-light)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Overage Calculation
                </p>
                <div className="space-y-1 text-sm text-slate-700">
                  <div className="flex justify-between">
                    <span>Minutes Used</span>
                    <span className="font-semibold">{bill.usedMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Plan Allowance</span>
                    <span className="font-semibold">{bill.allocatedMinutes} min</span>
                  </div>
                  <div className="flex justify-between border-t pt-1" style={{ borderColor: "var(--border-light)" }}>
                    <span className="text-rose-600">Overage</span>
                    <span className="font-bold text-rose-600">{bill.overageMinutes} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <span className="font-semibold">${bill.pricePerMinute.toFixed(4)}/min</span>
                  </div>
                  <div
                    className="flex justify-between rounded-lg bg-rose-50 px-3 py-1.5 mt-2"
                    style={{ border: "1px solid rgba(239,68,68,0.15)" }}
                  >
                    <span className="font-semibold text-rose-700">Total Due</span>
                    <span className="font-bold text-rose-600">${bill.overageAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Subscription details */}
              <div className="rounded-xl bg-white p-4 space-y-2" style={{ border: "1px solid var(--border-light)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Subscription Details
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-semibold text-slate-800">{bill.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Sub Status</span>
                    <SubscriptionStatusPill status={bill.subscriptionStatus} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Monthly Price</span>
                    <span className="font-semibold text-slate-800">${bill.monthlyPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Period</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {formatDate(bill.periodStart)}
                      {" → "}
                      {bill.periodEnd ? formatDate(bill.periodEnd) : "present"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Invoice meta */}
              <div className="rounded-xl bg-white p-4 space-y-2" style={{ border: "1px solid var(--border-light)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Invoice Info
                </p>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Invoice ID</span>
                    <span className="font-mono text-xs text-slate-700">
                      #{bill.invoiceId.slice(-10).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Generated</span>
                    <span className="font-semibold text-slate-800">{formatDate(bill.generatedAt)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Role</span>
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600 capitalize">
                      {bill.userRole}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
function AdminInvoiceMobileCard({ bill }: { bill: PendingBill }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = bill.subscriptionStatus === "active";

  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{
        boxShadow: "var(--shadow-sm)",
        border: `1px solid ${isActive ? "rgba(234,179,8,0.3)" : "rgba(239,68,68,0.25)"}`,
      }}
    >
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer"
        style={{
          background: isActive ? "rgba(234,179,8,0.05)" : "rgba(239,68,68,0.05)",
          borderBottom: `1px solid ${isActive ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)"}`,
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Receipt className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-amber-500" : "text-rose-500"}`} />
          <span className="text-xs font-semibold text-slate-800 truncate">{bill.userName}</span>
          {isActive && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">ACTIVE</span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="font-bold text-rose-600">${bill.overageAmount.toFixed(2)}</span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </div>

      <div className="p-4 space-y-2 text-sm">
        <div className="flex justify-between text-slate-600">
          <span>{bill.planName}</span>
          <span className="text-rose-500 font-semibold">+{bill.overageMinutes} min</span>
        </div>
        <div className="flex justify-between text-xs text-slate-400">
          <span>{formatDate(bill.periodStart)}</span>
          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-600">PENDING</span>
        </div>

        {expanded && (
          <div className="mt-2 rounded-xl bg-slate-50 p-3 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Allocated</span>
              <span className="font-semibold">{bill.allocatedMinutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Used</span>
              <span className="font-semibold">{bill.usedMinutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-500">Overage</span>
              <span className="font-semibold text-rose-500">
                {bill.overageMinutes} min × ${bill.pricePerMinute.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-1.5" style={{ borderColor: "var(--border-light)" }}>
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-700 truncate ml-2">{bill.userEmail}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminPendingBillsSection() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery<PendingBillsResponse>({
    queryKey: ["admin", "billing", "pending-bills"],
    queryFn: async () => {
      const res = await fetch("/api/admin/billing/pending-bills");
      if (!res.ok) throw new Error("Failed to fetch pending bills");
      return res.json();
    },
  });

  const allBills = data?.pendingBills ?? [];

  const bills = allBills.filter(
    (b) =>
      b.userName.toLowerCase().includes(search.toLowerCase()) ||
      b.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      b.planName.toLowerCase().includes(search.toLowerCase())
  );

  const totalDue = bills.reduce((sum, b) => sum + b.overageAmount, 0);
  const activeOverageCount = allBills.filter((b) => b.subscriptionStatus === "active").length;

  if (isLoading) {
    return (
      <div
        className="rounded-2xl bg-white p-6 animate-pulse"
        style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        <div className="h-4 w-48 rounded-full bg-slate-200 mb-4" />
        <div className="h-48 w-full rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (!isLoading && allBills.length === 0) return null;

  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{ boxShadow: "var(--shadow-sm)", border: "1px solid rgba(239,68,68,0.2)" }}
    >
      {/* Section header */}
      <div
        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ background: "rgba(239,68,68,0.04)", borderBottom: "1px solid rgba(239,68,68,0.15)" }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
            <FileText className="h-4 w-4 text-rose-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-700">Pending Overage Bills</p>
            <p className="text-xs text-rose-400">
              {allBills.length} customer{allBills.length !== 1 ? "s" : ""}
              {activeOverageCount > 0 && (
                <span className="text-amber-500 font-semibold">
                  {" "}· {activeOverageCount} with active subscriptions still over limit
                </span>
              )}
              {" · "}
              <span className="font-semibold">${totalDue.toFixed(2)} total due</span>
            </p>
          </div>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer or plan…"
            className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
      </div>

      {/* Active-subscription warning banner */}
      {activeOverageCount > 0 && (
        <div
          className="flex items-start gap-2 px-6 py-3 text-xs text-amber-700"
          style={{ background: "rgba(234,179,8,0.06)", borderBottom: "1px solid rgba(234,179,8,0.15)" }}
        >
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
          <span>
            <strong>{activeOverageCount}</strong> customer{activeOverageCount !== 1 ? "s have" : " has"} an{" "}
            <strong>active subscription</strong> but {activeOverageCount !== 1 ? "have" : "has"} already exceeded
            their plan's minute limit. Overage is being billed in real-time.
          </span>
        </div>
      )}

      {error ? (
        <div className="flex items-center gap-2 px-6 py-5 text-sm text-rose-600">
          <AlertCircle className="h-4 w-4" />
          Could not load pending bills.
        </div>
      ) : bills.length === 0 ? (
        <div className="px-6 py-5 text-sm text-slate-400 text-center">
          No results match your search.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-light)" }}>
                  {["Customer", "Plan", "Sub Status", "Period", "Overage", "Amount Due", "Actions", ""].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: "var(--muted-text)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bills.map((bill) => (
                  <AdminInvoiceRow key={bill.invoiceId} bill={bill} />
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "rgba(239,68,68,0.04)", borderTop: "1px solid rgba(239,68,68,0.15)" }}>
                  <td colSpan={5} className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Total Pending ({bills.length} invoices)
                  </td>
                  <td className="px-5 py-3 text-base font-bold text-rose-600">
                    ${totalDue.toFixed(2)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden p-4 space-y-3">
            {bills.map((bill) => (
              <AdminInvoiceMobileCard key={bill.invoiceId} bill={bill} />
            ))}
            <div className="flex items-center justify-between rounded-xl bg-rose-50 px-4 py-3">
              <span className="text-xs font-semibold text-rose-700">Total Pending</span>
              <span className="text-base font-bold text-rose-600">${totalDue.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}