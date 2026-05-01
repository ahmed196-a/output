import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { AppSettings } from "@/types/settings";

const settingsFallback: AppSettings = {
  profile: {
    fullName: "Demo User",
    email: "demo@example.com",
    timezone: "Europe/Dublin"
  },
  company: {
    companyName: "Demo Company"
  },
  notifications: {
    emailAlerts: true,
    smsAlerts: false,
    weeklyReports: true
  }
};

export const settingsService = {
  async getAccountSettings(): Promise<AppSettings> {
    return requestWithFallback<AppSettings>({
      request: async () => {
        const response = await apiClient.get<AppSettings>(API_ENDPOINTS.settings.account);
        return response.data;
      },
      fallback: () => settingsFallback
    });
  }
};
