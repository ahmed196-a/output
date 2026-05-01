import { useQuery } from "@tanstack/react-query";
import { adminBillingService, AdminUserBilling } from "@/services/admin/adminBillingService";

export function useAdminBillingQuery() {
  return useQuery<AdminUserBilling[]>({
    queryKey: ["admin", "billing"],
    queryFn: adminBillingService.getBillingData,
  });
}