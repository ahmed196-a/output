import { useQuery } from "@tanstack/react-query";
import { adminCustomersService, AdminCustomersParams } from "@/services/admin/adminCustomersService";

export function useAdminCustomersQuery(params?: AdminCustomersParams) {
  return useQuery({
    queryKey: ["admin", "customers", params ?? {}],
    queryFn: () => adminCustomersService.getCustomers(params)
  });
}

export function useAdminCustomerDetailQuery(customerId: string) {
  return useQuery({
    queryKey: ["admin", "customers", customerId],
    queryFn: () => adminCustomersService.getCustomerById(customerId),
    enabled: Boolean(customerId)
  });
}
