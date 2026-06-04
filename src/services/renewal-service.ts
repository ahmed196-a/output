import { apiClient } from "@/lib/api-client";

export type RenewablePlan = {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string;
  stripe_price_id: string | null;
  features: string[];
  is_featured: boolean;
};

export const renewalService = {
  async getPlans(): Promise<RenewablePlan[]> {
    const res = await fetch("/api/plans");
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error ?? "Failed to fetch plans.");
    return json.plans ?? [];
  },

  async createRenewalSession(params: {
    priceId: string;
    planId: string;
    planName: string;
  }): Promise<string> {
    const res = await apiClient.post<{ url: string; error?: string }>(
      "/billing/renew",
      params
    );
    if (res.data.error) throw new Error(res.data.error);
    return res.data.url;
  },
};