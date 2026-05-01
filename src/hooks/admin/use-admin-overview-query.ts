import { useQuery } from "@tanstack/react-query";
import { adminOverviewService } from "@/services/admin/adminOverviewService";

export function useAdminOverviewQuery() {
  return useQuery({
    queryKey: ["admin", "overview"],
    queryFn: adminOverviewService.getOverview
  });
}
