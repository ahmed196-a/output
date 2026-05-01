export type AdminUserBilling = {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  subscription: {
    id: string;
    status: string;
    planName: string;
    startedAt: string;
    endsAt: string | null;
    minutesUsed: number;
    totalMinutes: number;
    monthlyPrice: number;
    pricePerMinute: number;
  } | null;
};

export const adminBillingService = {
  async getBillingData(): Promise<AdminUserBilling[]> {
    const res = await fetch("/api/admin/billing");
    if (!res.ok) throw new Error("Failed to fetch billing data.");
    return res.json();
  },
};