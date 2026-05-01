export const queryKeys = {
  dashboardOverview: ["dashboard", "overview"] as const,
  agents: ["agents"] as const,
  agentById: (agentId: string) => ["agents", agentId] as const,
  callLogs: ["call-logs"] as const,
  recordings: ["recordings"] as const,
  billingSummary: ["billing", "summary"] as const,
  accountSettings: ["settings", "account"] as const,
  currentUser: ["auth", "current-user"] as const
};
