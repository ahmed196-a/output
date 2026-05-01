import { adminCustomerDetailsMock, adminCustomersMock } from "@/config/mock/admin";
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { AdminCustomer, AdminCustomerDetail } from "@/types/admin/customer";
import { PaginationParams } from "@/types/common";

export type AdminCustomersParams = PaginationParams & {
  search?: string;
  status?: AdminCustomer["status"] | "all";
};

export const adminCustomersService = {
  async getCustomers(params?: AdminCustomersParams): Promise<AdminCustomer[]> {
    return requestWithFallback<AdminCustomer[]>({
      request: async () => {
        const response = await apiClient.get<AdminCustomer[]>(API_ENDPOINTS.admin.customers, { params });
        return response.data;
      },
      fallback: () => adminCustomersMock
    });
  },
  async getCustomerById(customerId: string): Promise<AdminCustomerDetail | null> {
    return requestWithFallback<AdminCustomerDetail | null>({
      request: async () => {
        const response = await apiClient.get<AdminCustomerDetail>(API_ENDPOINTS.admin.customerDetail(customerId));
        return response.data;
      },
      fallback: () => adminCustomerDetailsMock[customerId] ?? null
    });
  }
};
