import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/query-keys";
import { billingService } from "@/services/billing-service";

export function useBillingSummaryQuery() {
  return useQuery({
    queryKey: queryKeys.billingSummary,
    queryFn: billingService.getSummary
  });
}
