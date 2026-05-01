export type Subscription = {
  id: string;
  tenantId: string;
  provider: "stripe";
  planName: string;
  status: "active" | "trialing" | "past_due" | "canceled";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd?: boolean;
};
