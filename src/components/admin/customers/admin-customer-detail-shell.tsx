"use client";

import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminCustomerDetailQuery } from "@/hooks/admin/use-admin-customers-query";
import { formatDateTime } from "@/utils/format";
import { AdminCustomerChangePassword } from "@/components/admin/customers/admin-customer-change-password";


type AdminCustomerDetailShellProps = {
  customerId: string;
};

export function AdminCustomerDetailShell({ customerId }: AdminCustomerDetailShellProps) {
  const { data, isLoading, error } = useAdminCustomerDetailQuery(customerId);

  return (
    <AdminPermissionGuard allow={["customers"]}>
      {isLoading ? (
        <LoadingSkeleton className="h-80 w-full" />
      ) : error ? (
        <ErrorState message="Customer detail could not be loaded." />
      ) : !data ? (
        <EmptyState title="Customer not found" message="No customer detail was found for this ID." />
      ) : (
        <div className="space-y-6">
          <PageHeader
            title={data.customer.companyName}
            description="Subscription, usage, agent assignment, billing state, and recent customer activity."
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Calls This Month" value={String(data.usageSummary.callsThisMonth)} />
            <StatCard label="Minutes This Month" value={String(data.usageSummary.minutesThisMonth)} />
            <StatCard label="Failed Calls" value={String(data.usageSummary.failedCalls)} />
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Account Snapshot</h3>
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
              <p>
                <span className="font-medium text-slate-900">Contact:</span> {data.customer.contactEmail}
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-slate-900">Account Status:</span>
                <StatusBadge
                  text={data.customer.status}
                  variant={data.customer.status === "active" ? "success" : data.customer.status === "flagged" ? "danger" : "warning"}
                />
              </p>
              <p className="flex items-center gap-2">
                <span className="font-medium text-slate-900">Subscription:</span>
                <StatusBadge
                  text={data.customer.subscriptionStatus}
                  variant={data.customer.subscriptionStatus === "active" ? "success" : data.customer.subscriptionStatus === "past_due" ? "danger" : "warning"}
                />
              </p>
              <p>
                <span className="font-medium text-slate-900">Open Invoices:</span> {data.customer.openInvoices}
              </p>
              <p>
                <span className="font-medium text-slate-900">Assigned Agents:</span> {data.assignedAgents.join(", ")}
              </p>
              <p>
                <span className="font-medium text-slate-900">Last Activity:</span>{" "}
                {formatDateTime(data.customer.lastActivityAt)}
              </p>
            </div>
          </section>

          <section className="rounded-xl border bg-white p-5 shadow-sm">
            <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
            <div className="mt-4 space-y-3">
              {data.recentActivity.map((activity) => (
                <article key={activity.id} className="rounded-lg border p-3">
                  <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activity.type} - {formatDateTime(activity.occurredAt)}
                  </p>
                </article>
              ))}
            </div>
          </section>
          
        </div>
      )}
    </AdminPermissionGuard>
  );
}
