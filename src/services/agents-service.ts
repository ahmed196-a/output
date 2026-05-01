import { agentsMock } from "@/config/mock/agents";
import { API_ENDPOINTS } from "@/config/endpoints";
import { apiClient } from "@/lib/api-client";
import { requestWithFallback } from "@/lib/request";
import { Agent } from "@/types/agent";
import { PaginationParams } from "@/types/common";

export type AgentListParams = PaginationParams & {
  search?: string;
  status?: Agent["status"] | "all";
};

export const agentsService = {
  async getAgents(params?: AgentListParams): Promise<Agent[]> {
    return requestWithFallback<Agent[]>({
      request: async () => {
        const response = await apiClient.get<Agent[]>(API_ENDPOINTS.agents.list, { params });
        return response.data;
      },
      fallback: () => agentsMock
    });
  },
  async getAgentById(agentId: string): Promise<Agent | null> {
    return requestWithFallback<Agent | null>({
      request: async () => {
        const response = await apiClient.get<Agent>(API_ENDPOINTS.agents.detail(agentId));
        return response.data;
      },
      fallback: () => agentsMock.find((agent) => agent.id === agentId) ?? null
    });
  }
};
