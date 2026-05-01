import { CallLog } from "@/types/call-log";
import { CdrEntry } from "@/types/cdr";
import { DateRangeParams, PaginationParams } from "@/types/common";
import { apiClient } from "@/lib/api-client";

export type AdminCallsParams = PaginationParams &
  DateRangeParams & {
    customerId?: string;
    agentId?: string;
    status?: CallLog["status"] | "all";
  };

export const adminCallsService = {
  async getCallLogs(params?: AdminCallsParams): Promise<CallLog[]> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<CallLog[]>("/admin/call-logs", { params });
    return response.data;
  },
  async getCdr(params?: AdminCallsParams): Promise<CdrEntry[]> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<CdrEntry[]>("/admin/call-logs/cdr", { params });
    return response.data;
  }
};
