export type InvoiceStatus = "paid" | "pending" | "failed";

export type Invoice = {
  id: string;
  tenantId?: string;
  period: string;
  amount: string;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string;
  currency?: string;
};
