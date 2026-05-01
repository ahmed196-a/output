export type AdminOverviewMetrics = {
  totalUsers: number;
  activeSubscriptions: number;
  totalMinutesUsed: number;
  totalRevenue: string;
};

export type AdminRecentSignup = {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  plan: string;
};

export type AdminOverviewData = {
  metrics: AdminOverviewMetrics;
  recentSignups: AdminRecentSignup[];
};

export const adminOverviewService = {
  async getOverview(): Promise<AdminOverviewData> {
    const res = await fetch("/api/admin/overview");
    if (!res.ok) throw new Error("Failed to fetch overview.");
    return res.json();
  },
};