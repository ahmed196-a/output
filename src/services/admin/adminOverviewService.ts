import { adminOverviewMock } from "@/config/mock/admin";
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { AdminOverviewData } from "@/types/admin/overview";

export const adminOverviewService = {
  async getOverview(): Promise<AdminOverviewData> {
    return requestWithFallback<AdminOverviewData>({
      request: async () => {
        const response = await apiClient.get<AdminOverviewData>(API_ENDPOINTS.admin.overview);
        return response.data;
      },
      fallback: () => adminOverviewMock
    });
  }
};
