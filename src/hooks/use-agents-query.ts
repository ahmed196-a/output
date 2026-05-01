import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { agentsService } from "@/services/agents-service";

export function useAgentsQuery() {
  return useQuery({
    queryKey: queryKeys.agents,
    queryFn: agentsService.getAgents
  });
}

export function useAgentByIdQuery(agentId: string) {
  return useQuery({
    queryKey: queryKeys.agentById(agentId),
    queryFn: () => agentsService.getAgentById(agentId),
    enabled: Boolean(agentId)
  });
}
