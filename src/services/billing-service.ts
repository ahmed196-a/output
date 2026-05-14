import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { Invoice } from "@/types/billing";
import { Subscription } from "@/types/subscription";
import { PaginationParams } from "@/types/common";

export type BillingSummary = {
  currentPlan: string;
  subscriptionStatus: "active" | "past_due" | "canceled";
  usageSummary: string;
  subscription?: Subscription;
  invoices: Invoice[];
};

export const billingService = {
  async getSummary(): Promise<BillingSummary> {
    return requestWithFallback<BillingSummary>({
      request: async () => {
        const response = await apiClient.get<BillingSummary>(API_ENDPOINTS.billing.summary);
        return response.data;
      },
      fallback: () => ({
        currentPlan: "Growth",
        subscriptionStatus: "active",
        usageSummary: "28,904 minutes used this cycle",
        invoices: []
      })
    });
  },
  async getInvoices(params?: PaginationParams): Promise<Invoice[]> {
    return requestWithFallback<Invoice[]>({
      request: async () => {
        const response = await apiClient.get<Invoice[]>(API_ENDPOINTS.billing.invoices, { params });
        return response.data;
      },
      fallback: () => []
    });
  }
};
