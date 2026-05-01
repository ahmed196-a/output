"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-state";
import { EmptyState } from "@/components/shared/empty-state";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { useAdminPlansQuery, useAdminPlanMutations } from "@/hooks/admin/use-admin-plans-query";
import { AdminPlan, AdminPlanInput } from "@/services/admin/adminPlansService";

const EMPTY_FORM: AdminPlanInput = {
  name: "",
  display_name: "",
  monthly_price: 0,
  total_minutes: 0,
  price_per_minute: 0,
  description: "",
  is_active: true,
};

export function AdminPlansShell() {
  const { data: plans = [], isLoading, error } = useAdminPlansQuery();
  const { createPlan, updatePlan, deletePlan } = useAdminPlanMutations();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdminPlan | null>(null);
  const [form, setForm] = useState<AdminPlanInput>(EMPTY_FORM);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function openCreate() {
    setEditingPlan(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalOpen(true);
  }

  function openEdit(plan: AdminPlan) {
    setEditingPlan(plan);
    setForm({
      name: plan.name,
      display_name: plan.display_name,
      monthly_price: plan.monthly_price,
      total_minutes: plan.total_minutes,
      price_per_minute: plan.price_per_minute,
      description: plan.description ?? "",
      is_active: plan.is_active,
    });
    setFormError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingPlan(null);
    setFormError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingPlan) {
        await updatePlan.mutateAsync({ id: editingPlan.id, input: form });
      } else {
        await createPlan.mutateAsync(form);
      }
      closeModal();
    } catch (err: any) {
      setFormError(err?.message ?? "Something went wrong.");
    }
  }

  async function handleDelete(planId: string) {
    try {
      await deletePlan.mutateAsync(planId);
      setConfirmDeleteId(null);
    } catch {
      // errors shown inline
    }
  }

  const isSubmitting = createPlan.isPending || updatePlan.isPending;

  return (
    <AdminPermissionGuard allow={["plans"]}>
      <div className="space-y-6">
        <PageHeader
          title="Plans"
          description="Manage subscription plans available to customers."
          action={
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Plan
            </button>
          }
        />

        {isLoading ? (
          <LoadingSkeleton className="h-64 w-full" />
        ) : error ? (
          <ErrorState message="Could not load plans." />
        ) : plans.length === 0 ? (
          <EmptyState title="No plans yet" message="Create your first subscription plan." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl bg-white p-5 flex flex-col gap-3"
                style={{ boxShadow: "var(--shadow-sm)", border: "1px solid var(--border-light)" }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold text-slate-900">{plan.display_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">{plan.name}</p>
                  </div>
                  <StatusBadge
                    text={plan.is_active ? "Active" : "Inactive"}
                    variant={plan.is_active ? "success" : "neutral"}
                  />
                </div>

                {plan.description && (
                  <p className="text-sm text-slate-500">{plan.description}</p>
                )}

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Monthly</p>
                    <p className="text-sm font-bold text-slate-800">${plan.monthly_price}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Minutes</p>
                    <p className="text-sm font-bold text-slate-800">{plan.total_minutes}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Per Min</p>
                    <p className="text-sm font-bold text-slate-800">${plan.price_per_minute}</p>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(plan.id)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-100 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h3 className="text-base font-semibold text-slate-900">
                {editingPlan ? "Edit Plan" : "New Plan"}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Internal Name <span className="text-rose-500">*</span></label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. starter"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Display Name <span className="text-rose-500">*</span></label>
                  <input
                    required
                    value={form.display_name}
                    onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                    placeholder="e.g. Starter Plan"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Monthly Price ($)</label>
                  <input
                    type="number" min="0" step="0.01" required
                    value={form.monthly_price}
                    onChange={(e) => setForm((f) => ({ ...f, monthly_price: parseFloat(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Minutes</label>
                  <input
                    type="number" min="1" required
                    value={form.total_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, total_minutes: parseInt(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Price/Minute ($)</label>
                  <input
                    type="number" min="0" step="0.000001" required
                    value={form.price_per_minute}
                    onChange={(e) => setForm((f) => ({ ...f, price_per_minute: parseFloat(e.target.value) }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Optional plan description..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, is_active: !f.is_active }))}
                  className={`transition-colors ${form.is_active ? "text-indigo-600" : "text-slate-400"}`}
                >
                  {form.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
                <span className="text-sm text-slate-600">{form.is_active ? "Active" : "Inactive"}</span>
              </div>

              {formError && <p className="text-xs text-rose-500">{formError}</p>}
            </form>
            <div className="flex gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit as any}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Saving…" : editingPlan ? "Save Changes" : "Create Plan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-semibold text-slate-900">Delete Plan?</h3>
            <p className="text-sm text-slate-500">
              This will permanently delete the plan. Any subscriptions referencing it will be restricted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletePlan.isPending}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-50"
              >
                {deletePlan.isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPermissionGuard>
  );
}