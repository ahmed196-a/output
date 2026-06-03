// src/components/billing/subscription-expiry-banner.tsx
"use client";

import { AlertTriangle, RefreshCw, XCircle } from "lucide-react";

type SubscriptionExpiryBannerProps = {
  status: string;
  endsAt: string | null;
  onRenew: () => void;
};

function getDaysUntilExpiry(endsAt: string | null): number | null {
  if (!endsAt) return null;
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function SubscriptionExpiryBanner({
  status,
  endsAt,
  onRenew,
}: SubscriptionExpiryBannerProps) {
  const daysLeft = getDaysUntilExpiry(endsAt);

  // Show "expired" banner when status is cancelled / past_due or days <= 0
  const isExpired =
    status === "cancelled" ||
    status === "past_due" ||
    (daysLeft !== null && daysLeft <= 0);

  // Show "expiring soon" banner when 3 or fewer days remain (and not already expired)
  const isExpiringSoon =
    !isExpired && daysLeft !== null && daysLeft <= 3 && daysLeft > 0;

  if (!isExpired && !isExpiringSoon) return null;

  if (isExpired) {
    return (
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl px-5 py-4"
        style={{
          background: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
          border: "1px solid #fecdd3",
        }}
      >
        <div className="flex items-start gap-3">
          <div
            className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ background: "#fee2e2" }}
          >
            <XCircle className="h-5 w-5 text-rose-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-rose-900">Subscription Expired</p>
            <p className="text-sm text-rose-600 mt-0.5">
              Your subscription has ended. Renew now to restore full access to your dashboard.
            </p>
          </div>
        </div>
        <button
          onClick={onRenew}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, #e11d48, #f43f5e)", boxShadow: "0 4px 14px rgba(225,29,72,0.30)" }}
        >
          <RefreshCw className="h-4 w-4" />
          Renew Subscription
        </button>
      </div>
    );
  }

  // Expiring soon
  return (
    <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl px-5 py-4"
      style={{
        background: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        border: "1px solid #fde68a",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl"
          style={{ background: "#fef3c7" }}
        >
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-900">
            Subscription Expiring in {daysLeft} {daysLeft === 1 ? "Day" : "Days"}
          </p>
          <p className="text-sm text-amber-700 mt-0.5">
            Renew before{" "}
            <span className="font-medium">
              {endsAt ? new Date(endsAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : ""}
            </span>{" "}
            to avoid any service interruption.
          </p>
        </div>
      </div>
      <button
        onClick={onRenew}
        className="flex flex-shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: "linear-gradient(135deg, #d97706, #f59e0b)", boxShadow: "0 4px 14px rgba(217,119,6,0.25)" }}
      >
        <RefreshCw className="h-4 w-4" />
        Renew Now
      </button>
    </div>
  );
}
