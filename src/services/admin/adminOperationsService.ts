import { apiClient } from "@/lib/api-client";

export type ProviderHealth = {
  provider: "retell" | "telnyx" | "stripe" | "supabase" | "n8n" | "short_io" | "data8";
  status: "healthy" | "degraded" | "down";
  message?: string;
};

export type WorkflowExecutionIssue = {
  id: string;
  workflowName: string;
  status: "failed" | "retrying";
  occurredAt: string;
};

export type AdminOperationsSnapshot = {
  providerHealth: ProviderHealth[];
  workflowIssues: WorkflowExecutionIssue[];
};

export const adminOperationsService = {
  async getSnapshot(): Promise<AdminOperationsSnapshot> {
    // TODO: replace endpoint when admin API contracts are available.
    const response = await apiClient.get<AdminOperationsSnapshot>("/admin/operations/snapshot");
    return response.data;
  }
};
