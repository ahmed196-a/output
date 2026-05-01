import { Agent } from "@/types/agent";
import { apiClient } from "@/lib/api-client";
import { PaginationParams } from "@/types/common";

export type AdminAgentsParams = PaginationParams & {
  search?: string;
  status?: Agent["status"] | "all";
  customerId?: string;
};

export const adminAgentsService = {
  async getAgents(params?: AdminAgentsParams): Promise<Agent[]> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<Agent[]>("/admin/agents", { params });
    return response.data;
  }
};
