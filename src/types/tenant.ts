export type Tenant = {
  id: string;
  name: string;
  planCode: string;
  timezone: string;
  currency: string;
  status: "active" | "suspended" | "trialing";
};
