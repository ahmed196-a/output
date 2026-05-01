export type DashboardKpi = {
  label: string;
  value: string;
  change?: string;
};

export type TrendPoint = {
  date: string;
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
};

export type AgentPerformancePoint = {
  agentName: string;
  successRate: number;
  avgDurationSeconds: number;
};

export type DashboardSummary = {
  kpis: DashboardKpi[];
  trends: TrendPoint[];
  agentPerformance: AgentPerformancePoint[];
};
