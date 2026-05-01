import { useQuery } from "@tanstack/react-query";
import { adminOverviewService, AdminOverviewData } from "@/services/admin/adminOverviewService";

export function useAdminOverviewQuery() {
  return useQuery<AdminOverviewData>({
    queryKey: ["admin", "overview"],
    queryFn: adminOverviewService.getOverview,
  });
}