export const API_ENDPOINTS = {
  auth: {
    login: "/auth/login",
    me: "/auth/me",
    logout: "/auth/logout"
  },
  dashboard: {
    overview: "/dashboard/overview"
  },
  agents: {
    list: "/agents",
    detail: (agentId: string) => `/agents/${agentId}`
  },
  callLogs: {
    list: "/call-logs",
    cdrList: "/call-logs/cdr"
  },
  recordings: {
    list: "/recordings"
  },
  billing: {
    summary: "/billing/summary",
    invoices: "/billing/invoices"
  },
  settings: {
    account: "/settings/account"
  },
  admin: {
    overview: "/admin/overview",
    customers: "/admin/customers",
    customerDetail: (customerId: string) => `/admin/customers/${customerId}`
  }
} as const;

// TODO: Align these placeholders with backend endpoint contracts.
