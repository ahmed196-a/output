export type AdminPlan = {
  id: string;
  name: string;
  display_name: string;
  monthly_price: number;
  total_minutes: number;
  price_per_minute: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AdminPlanInput = Omit<AdminPlan, "id" | "created_at" | "updated_at">;

export const adminPlansService = {
  async getPlans(): Promise<AdminPlan[]> {
    const res = await fetch("/api/admin/plans");
    if (!res.ok) throw new Error("Failed to fetch plans.");
    return res.json();
  },

  async createPlan(input: AdminPlanInput): Promise<AdminPlan> {
    const res = await fetch("/api/admin/plans", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to create plan.");
    return res.json();
  },

  async updatePlan(planId: string, input: Partial<AdminPlanInput>): Promise<AdminPlan> {
    const res = await fetch(`/api/admin/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Failed to update plan.");
    return res.json();
  },

  async deletePlan(planId: string): Promise<void> {
    const res = await fetch(`/api/admin/plans/${planId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete plan.");
  },
};