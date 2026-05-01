export type AdminCustomer = {
  id: string;
  fullName: string;
  email: string;
  role: "owner" | "member";
  isActive: boolean;
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
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