import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminPlansService, AdminPlan, AdminPlanInput } from "@/services/admin/adminPlansService";

export function useAdminPlansQuery() {
  return useQuery<AdminPlan[]>({
    queryKey: ["admin", "plans"],
    queryFn: adminPlansService.getPlans,
  });
}

export function useAdminPlanMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "plans"] });

  const createPlan = useMutation({
    mutationFn: (input: AdminPlanInput) => adminPlansService.createPlan(input),
    onSuccess: invalidate,
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<AdminPlanInput> }) =>
      adminPlansService.updatePlan(id, input),
    onSuccess: invalidate,
  });

  const deletePlan = useMutation({
    mutationFn: (id: string) => adminPlansService.deletePlan(id),
    onSuccess: invalidate,
  });

  return { createPlan, updatePlan, deletePlan };
}