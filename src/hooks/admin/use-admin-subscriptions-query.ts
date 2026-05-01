import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminSubscriptionsService,
  AdminSubscription,
  SubscriptionAction,
} from "@/services/admin/adminSubscriptionsService";

export function useAdminSubscriptionsQuery() {
  return useQuery<AdminSubscription[]>({
    queryKey: ["admin", "subscriptions"],
    queryFn: adminSubscriptionsService.getSubscriptions,
  });
}

export function useSubscriptionAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: SubscriptionAction }) =>
      adminSubscriptionsService.performAction(id, action),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "subscriptions"] }),
  });
}