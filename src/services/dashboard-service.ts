import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { Invoice } from "@/types/billing";
import { CallLog } from "@/types/call-log";
import { DashboardSummary } from "@/types/dashboard";
import { Recording } from "@/types/recording";

export type DashboardOverview = {
  summary: DashboardSummary;
  recentCallLogs: CallLog[];
  recentRecordings: Recording[];
  invoices: Invoice[];
};

export const dashboardService = {
  async getOverview(): Promise<DashboardOverview> {
    return requestWithFallback<DashboardOverview>({
      request: async () => {
        const response = await apiClient.get<DashboardOverview>(API_ENDPOINTS.dashboard.overview);
        return response.data;
      },
      fallback: () => ({
        summary: {
          kpis: [],
          trends: [],
          agentPerformance: []
        },
        recentCallLogs: [],
        recentRecordings: [],
        invoices: []
      })
    });
  }
};
