import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { renewalService, RenewablePlan } from "@/services/renewal-service";

export function useRenewal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<RenewablePlan | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plansQuery = useQuery({
    queryKey: ["renewal", "plans"],
    queryFn: renewalService.getPlans,
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const open = () => {
    setIsOpen(true);
    setSelectedPlan(null);
    setError(null);
  };

  const close = () => {
    setIsOpen(false);
    setSelectedPlan(null);
    setError(null);
    setLoadingPlanId(null);
  };

  const handleRenew = async (plan: RenewablePlan) => {
    if (!plan.stripe_price_id) {
      setError(
        `No Stripe price configured for "${plan.display_name}". Ask your admin to add it in the Plans settings.`
      );
      return;
    }

    setError(null);
    setLoadingPlanId(plan.id);

    try {
      const url = await renewalService.createRenewalSession({
        priceId: plan.stripe_price_id,
        planId: plan.id,
        planName: plan.name,
      });
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoadingPlanId(null);
    }
  };

  return {
    isOpen,
    open,
    close,
    plans: plansQuery.data ?? [],
    plansLoading: plansQuery.isLoading,
    plansError: plansQuery.error ? "Failed to load plans. Please try again." : null,
    selectedPlan,
    setSelectedPlan,
    loadingPlanId,
    error,
    handleRenew,
  };
}