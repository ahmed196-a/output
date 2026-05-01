export type CustomerSubscriptionStatus = "active" | "trialing" | "past_due" | "canceled";

export type AdminCustomer = {
  id: string;
  companyName: string;
  contactEmail: string;
  status: "active" | "inactive" | "flagged";
  subscriptionStatus: CustomerSubscriptionStatus;
  monthlyUsageMinutes: number;
  assignedAgents: number;
  openInvoices: number;
  lastActivityAt: string;
};

export type CustomerActivity = {
  id: string;
  type: "call" | "billing" | "agent" | "support";
  description: string;
  occurredAt: string;
};

export type AdminCustomerDetail = {
  customer: AdminCustomer;
  usageSummary: {
    callsThisMonth: number;
    minutesThisMonth: number;
    failedCalls: number;
  };
  assignedAgents: string[];
  recentActivity: CustomerActivity[];
};
