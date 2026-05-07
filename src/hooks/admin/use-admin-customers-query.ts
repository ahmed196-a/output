import { useQuery } from "@tanstack/react-query";
import { adminCustomersService, AdminCustomersParams } from "@/services/admin/adminCustomersService";
import { AdminCustomer } from "@/types/admin/customer";

export function useAdminCustomersQuery(params?: AdminCustomersParams) {
  return useQuery<AdminCustomer[]>({
    queryKey: ["admin", "customers", params ?? {}],
    queryFn: () => adminCustomersService.getCustomers(params),
  });
}

/**
 * Fetches a single customer detail by ID.
 * Returns a placeholder structure expected by AdminCustomerDetailShell.
 */
export function useAdminCustomerDetailQuery(customerId: string) {
  return useQuery({
    queryKey: ["admin", "customer-detail", customerId],
    queryFn: async () => {
      const customers = await adminCustomersService.getCustomers();
      const c = customers.find((cust) => cust.id === customerId);
      if (!c) return null;
      return {
        customer: {
          companyName: c.fullName,
          contactEmail: c.email,
          status: c.isActive ? "active" : "inactive",
          subscriptionStatus: c.subscription?.status ?? "none",
          openInvoices: 0,
          lastActivityAt: c.updatedAt,
        },
        assignedAgents: [] as string[],
        usageSummary: {
          callsThisMonth: 0,
          minutesThisMonth: c.subscription?.minutesUsed ?? 0,
          failedCalls: 0,
        },
        recentActivity: [] as { id: string; description: string; type: string; occurredAt: string }[],
      };
    },
    enabled: !!customerId,
  });
}