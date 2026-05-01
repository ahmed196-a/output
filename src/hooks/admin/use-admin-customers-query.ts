import { useQuery } from "@tanstack/react-query";
import { adminCustomersService, AdminCustomersParams } from "@/services/admin/adminCustomersService";
import { AdminCustomer } from "@/types/admin/customer";

export function useAdminCustomersQuery(params?: AdminCustomersParams) {
  return useQuery<AdminCustomer[]>({
    queryKey: ["admin", "customers", params ?? {}],
    queryFn: () => adminCustomersService.getCustomers(params),
  });
}