import { Invoice } from "@/types/billing";
import { Subscription } from "@/types/subscription";
import { PaginationParams } from "@/types/common";
import { apiClient } from "@/lib/api-client";

export type AdminBillingSummary = {
  failedPayments: number;
  overdueAccounts: number;
  activeSubscriptions: number;
};

export const adminBillingService = {
  async getBillingSummary(): Promise<AdminBillingSummary> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<AdminBillingSummary>("/admin/billing/summary");
    return response.data;
  },
  async getSubscriptions(params?: PaginationParams): Promise<Subscription[]> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<Subscription[]>("/admin/billing/subscriptions", { params });
    return response.data;
  },
  async getInvoices(params?: PaginationParams): Promise<Invoice[]> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<Invoice[]>("/admin/billing/invoices", { params });
    return response.data;
  }
};
