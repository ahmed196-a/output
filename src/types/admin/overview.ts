export type AdminOverviewMetrics = {
  totalCustomers: number;
  activeSubscriptions: number;
  activeAgents: number;
  callsToday: number;
  monthlyUsageMinutes: number;
  failedCalls: number;
  openBillingIssues: number;
};

export type RecentSignup = {
  id: string;
  companyName: string;
  createdAt: string;
  plan: string;
};

export type FailedWorkflow = {
  id: string;
  workflowName: string;
  provider: "n8n" | "retell" | "telnyx" | "stripe" | "supabase" | "short_io" | "data8";
  occurredAt: string;
  status: "failed" | "retrying";
};

export type AdminOverviewData = {
  metrics: AdminOverviewMetrics;
  recentSignups: RecentSignup[];
  recentFailedWorkflows: FailedWorkflow[];
};
