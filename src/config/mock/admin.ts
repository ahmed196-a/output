import { AdminCustomer, AdminCustomerDetail } from "@/types/admin/customer";
import { AdminOverviewData } from "@/types/admin/overview";

export const adminOverviewMock: AdminOverviewData = {
  metrics: {
    totalCustomers: 128,
    activeSubscriptions: 114,
    activeAgents: 346,
    callsToday: 4291,
    monthlyUsageMinutes: 289043,
    failedCalls: 73,
    openBillingIssues: 9
  },
  recentSignups: [
    { id: "c_001", companyName: "Northwind Logistics", createdAt: "2026-04-10T11:05:00Z", plan: "Growth" },
    { id: "c_002", companyName: "Aster Clinics", createdAt: "2026-04-10T10:11:00Z", plan: "Pro" }
  ],
  recentFailedWorkflows: [
    { id: "wf_001", workflowName: "Lead Enrichment", provider: "n8n", occurredAt: "2026-04-10T10:21:00Z", status: "failed" },
    {
      id: "wf_002",
      workflowName: "Post-call Billing Sync",
      provider: "stripe",
      occurredAt: "2026-04-10T09:42:00Z",
      status: "retrying"
    }
  ]
};

export const adminCustomersMock: AdminCustomer[] = [
  {
    id: "cust_001",
    companyName: "Northwind Logistics",
    contactEmail: "ops@northwind.io",
    status: "active",
    subscriptionStatus: "active",
    monthlyUsageMinutes: 10432,
    assignedAgents: 7,
    openInvoices: 0,
    lastActivityAt: "2026-04-10T11:02:00Z"
  },
  {
    id: "cust_002",
    companyName: "Aster Clinics",
    contactEmail: "it@asterclinics.ie",
    status: "flagged",
    subscriptionStatus: "past_due",
    monthlyUsageMinutes: 8210,
    assignedAgents: 4,
    openInvoices: 2,
    lastActivityAt: "2026-04-10T09:48:00Z"
  },
  {
    id: "cust_003",
    companyName: "Beacon Retail",
    contactEmail: "support@beaconretail.co",
    status: "active",
    subscriptionStatus: "trialing",
    monthlyUsageMinutes: 1902,
    assignedAgents: 2,
    openInvoices: 0,
    lastActivityAt: "2026-04-09T18:14:00Z"
  }
];

export const adminCustomerDetailsMock: Record<string, AdminCustomerDetail> = {
  cust_001: {
    customer: adminCustomersMock[0],
    usageSummary: {
      callsThisMonth: 4123,
      minutesThisMonth: 10432,
      failedCalls: 34
    },
    assignedAgents: ["Sales Agent", "Support Agent", "Booking Agent"],
    recentActivity: [
      { id: "act_001", type: "call", description: "High call traffic spike detected.", occurredAt: "2026-04-10T11:02:00Z" },
      { id: "act_002", type: "billing", description: "Invoice INV-884 marked paid.", occurredAt: "2026-04-09T17:11:00Z" }
    ]
  },
  cust_002: {
    customer: adminCustomersMock[1],
    usageSummary: {
      callsThisMonth: 3110,
      minutesThisMonth: 8210,
      failedCalls: 58
    },
    assignedAgents: ["Care Intake Agent", "Renewal Agent"],
    recentActivity: [
      {
        id: "act_003",
        type: "billing",
        description: "Payment failed for latest invoice. Account flagged for finance review.",
        occurredAt: "2026-04-10T09:48:00Z"
      }
    ]
  }
};
