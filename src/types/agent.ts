export type AgentStatus = "active" | "paused" | "draft";

export type CampaignStatus = "running" | "idle" | "stopped";

export type Agent = {
  id: string;
  name: string;
  status: AgentStatus;
  phoneNumber: string;
  campaignStatus: CampaignStatus;
  totalCalls: number;
  answerRate: number;
  avgDurationSeconds: number;
};
