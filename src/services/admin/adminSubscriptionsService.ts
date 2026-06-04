export type AdminSubscription = {
  id: string;
  status: "active" | "cancelled" | "past_due" | "trialing"|"expired";
  startedAt: string;
  endsAt: string | null;
  cancelledAt: string | null;
  minutesUsed: number;
  monthlyPrice: number;
  pricePerMinute: number;
  totalMinutes: number;
  userFullName: string;
  userEmail: string;
  userId: string;
  planDisplayName: string;
  planId: string;
  usageMinutes: number;
};

export type SubscriptionAction = "pause" | "resume" | "terminate"| "renew";

export const adminSubscriptionsService = {
  async getSubscriptions(): Promise<AdminSubscription[]> {
    const res = await fetch("/api/admin/subscriptions");
    if (!res.ok) throw new Error("Failed to fetch subscriptions.");
    return res.json();
  },

  async performAction(subscriptionId: string, action: SubscriptionAction): Promise<void> {
    const res = await fetch(`/api/admin/subscriptions/${subscriptionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`Failed to ${action} subscription.`);
  },
};