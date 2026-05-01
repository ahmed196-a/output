import { useQuery } from "@tanstack/react-query";
import { adminUsersService, ManagedUser } from "@/services/admin/adminUsersService";

export function useAdminUsersQuery() {
  return useQuery<ManagedUser[]>({
    queryKey: ["admin", "users"],
    queryFn: () => adminUsersService.getAllUsers(),
  });
}
