"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { useAdminOverviewQuery } from "@/hooks/admin/use-admin-overview-query";
import { formatDateTime } from "@/utils/format";

export function AdminOverviewShell() {
  const { data, isLoading, error } = useAdminOverviewQuery();

  return (
    <AdminPermissionGuard allow={["overview"]}>
      {isLoading ? (
        <LoadingSkeleton className="h-96 w-full" />
      ) : error ? (
        <ErrorState message="Admin overview could not be loaded." />
      ) : !data ? (
        <EmptyState title="No overview data" message="No platform overview metrics are available." />
      ) : (
      <div className="space-y-6">
        <PageHeader
          title="Platform Overview"
          description="System-wide operational and customer metrics for internal monitoring."
        />

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total Customers" value={String(data.metrics.totalCustomers)} />
          <StatCard label="Active Subscriptions" value={String(data.metrics.activeSubscriptions)} />
          <StatCard label="Active AI Agents" value={String(data.metrics.activeAgents)} />
          <StatCard label="Calls Today" value={String(data.metrics.callsToday)} />
          <StatCard label="Monthly Usage (min)" value={String(data.metrics.monthlyUsageMinutes)} />
          <StatCard label="Failed Calls" value={String(data.metrics.failedCalls)} />
          <StatCard label="Open Billing Issues" value={String(data.metrics.openBillingIssues)} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <article>
            <h3 className="mb-3 text-base font-semibold text-slate-900">Recent Signups</h3>
            <DataTable
              rows={data.recentSignups}
              columns={[
                { key: "companyName", label: "Company" },
                { key: "plan", label: "Plan" },
                {
                  key: "createdAt",
                  label: "Signed Up",
                  render: (value) => formatDateTime(String(value))
                }
              ]}
            />
          </article>

          <article>
            <h3 className="mb-3 text-base font-semibold text-slate-900">Recent Failed Workflows</h3>
            <DataTable
              rows={data.recentFailedWorkflows}
              columns={[
                { key: "workflowName", label: "Workflow" },
                { key: "provider", label: "Provider" },
                {
                  key: "status",
                  label: "Status",
                  render: (value) => (
                    <StatusBadge text={String(value)} variant={String(value) === "failed" ? "danger" : "warning"} />
                  )
                },
                {
                  key: "occurredAt",
                  label: "Occurred At",
                  render: (value) => formatDateTime(String(value))
                }
              ]}
            />
          </article>
        </section>
      </div>
      )}
    </AdminPermissionGuard>
  );
}
