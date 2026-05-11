export type AdminCustomer = {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "member";
  isActive: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
  usageMinutes: number;
  subscription: {
    id: string;
    status: string;
    planName: string;
    minutesUsed: number;
    totalMinutes: number;
    monthlyPrice: number;
    startedAt: string;
    endsAt: string | null;
  } | null;
};

/** Shape used by mock data and customer detail views */
export type AdminCustomerMock = {
  id: string;
  companyName: string;
  contactEmail: string;
  status: string;
  subscriptionStatus: string;
  monthlyUsageMinutes: number;
  assignedAgents: number;
  openInvoices: number;
  lastActivityAt: string;
};

export type AdminCustomerDetail = {
  customer: AdminCustomerMock;
  usageSummary: {
    callsThisMonth: number;
    minutesThisMonth: number;
    failedCalls: number;
  };
  assignedAgents: string[];
  recentActivity: {
    id: string;
    type: string;
    description: string;
    occurredAt: string;
  }[];
};