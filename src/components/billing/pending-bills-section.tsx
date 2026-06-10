// src/components/billing/pending-bills-section.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { AlertCircle, AlertTriangle, Clock, FileText, Receipt,CreditCard } from "lucide-react";
import { formatDate } from "@/utils/format";

type PendingBill = {
  invoiceId: string;
  subscriptionId: string;
  subscriptionStatus: "active" | "expired" | "past_due";
  planName: string;
  invoiceStatus: "pending" | "paid" | "dismissed";
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

function InvoiceCard({ bill }: { bill: PendingBill }) {
  return (
    <div
      className="rounded-2xl bg-white overflow-hidden"
      style={{
        boxShadow: "var(--shadow-sm)",
        border: "1px solid rgba(234,179,8,0.3)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{
          background: "rgba(234,179,8,0.06)",
          borderBottom: "1px solid rgba(234,179,8,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <Receipt className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-600">
            Active Overage Invoice
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
            SUBSCRIPTION ACTIVE
          </span>
          <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-600">
            PENDING
          </span>
        </div>
      </div>

      {/* Active overage notice */}
      <div
        className="flex items-start gap-2 px-5 py-2.5 text-xs text-amber-700"
        style={{ background: "rgba(234,179,8,0.07)", borderBottom: "1px solid rgba(234,179,8,0.12)" }}
      >
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
        <span>
          Your subscription is active but you've exceeded your plan's minute limit.
          This overage is being tracked and updated in real-time.
        </span>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {/* Plan + Period */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">{bill.planName} Plan</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {formatDate(bill.periodStart)}
              {bill.periodEnd ? ` → ${formatDate(bill.periodEnd)}` : " → present"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-rose-600">
              ${bill.overageAmount.toFixed(2)}
            </p>
            <p className="text-xs text-slate-400">Due now</p>
          </div>
        </div>

        {/* Usage breakdown */}
        <div className="rounded-xl bg-slate-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Usage Breakdown
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-base font-bold text-slate-800">{bill.allocatedMinutes}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Plan Minutes</p>
            </div>
            <div>
              <p className="text-base font-bold text-slate-800">{bill.usedMinutes}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Minutes Used</p>
            </div>
            <div>
              <p className="text-base font-bold text-rose-500">{bill.overageMinutes}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Overage</p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden mt-1">
            <div
              className="h-full rounded-full bg-rose-500 transition-all"
              style={{
                width: `${Math.min(100, Math.round((bill.usedMinutes / bill.allocatedMinutes) * 100))}%`,
              }}
            />
          </div>
          <p className="text-xs text-rose-500 font-medium">
            {Math.round((bill.usedMinutes / bill.allocatedMinutes) * 100)}% of plan used — limit exceeded
          </p>
        </div>

        {/* Calculation line */}
        <div className="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5">
          <div className="text-xs text-slate-600">
            <span className="font-semibold">{bill.overageMinutes} min</span>
            {" × "}
            <span className="font-semibold">${bill.pricePerMinute.toFixed(4)}/min</span>
            {" = "}
          </div>
          <span className="text-sm font-bold text-rose-600">
            ${bill.overageAmount.toFixed(2)}
          </span>
        </div>

        {/* Invoice meta */}
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Generated: {formatDate(bill.generatedAt)}
          </span>
          <span className="font-mono text-[10px]">
            #{bill.invoiceId.slice(-8).toUpperCase()}
          </span>
        </div>

        {/* Pay Now button */}
        <button
          disabled
          title="Contact your administrator to settle this overage invoice"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity cursor-not-allowed opacity-60"
          style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}
        >
          <CreditCard className="h-4 w-4" />
          Pay Now — ${bill.overageAmount.toFixed(2)}
        </button>
        <p className="text-center text-[10px] text-slate-400">
          Contact your administrator to settle this invoice
        </p>
      </div>
    </div>
  );
}

export function PendingBillsSection() {
  const { data, isLoading, error } = useQuery<PendingBillsResponse>({
    queryKey: ["billing", "pending-bills"],
    queryFn: async () => {
      const res = await apiClient.get<PendingBillsResponse>("/billing/pending-bills");
      return res.data;
    },
    refetchInterval: 60_000, // refresh every minute to keep overage live
  });

  const bills = data?.pendingBills ?? [];

  if (isLoading) {
    return (
      <div
        className="rounded-2xl bg-white p-6 animate-pulse"
        style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
      >
        <div className="h-4 w-40 rounded-full bg-slate-200 mb-4" />
        <div className="h-32 w-full rounded-xl bg-slate-100" />
      </div>
    );
  }

  if (error || bills.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <div
        className="flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{
          background: "rgba(239,68,68,0.05)",
          border: "1px solid rgba(239,68,68,0.2)",
        }}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
          <FileText className="h-4 w-4 text-rose-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-rose-700">
            {bills.length} Pending Bill{bills.length > 1 ? "s" : ""}
          </p>
          <p className="text-xs text-rose-400">
            Total due:{" "}
            <span className="font-semibold">
              ${bills.reduce((s, b) => s + b.overageAmount, 0).toFixed(2)}
            </span>
          </p>
        </div>
        <span className="ml-auto rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-bold text-white">
          {bills.length}
        </span>
      </div>

      {/* Invoice cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        {bills.map((bill) => (
          <InvoiceCard key={bill.invoiceId} bill={bill} />
        ))}
      </div>
    </div>
  );
}