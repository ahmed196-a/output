"use client";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { DataTable } from "@/components/shared/data-table";
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
            description="Real-time metrics pulled from your database."
          />

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total Customers"
              value={String(data.metrics.totalUsers)}
            />
            <StatCard
              label="Active Subscriptions"
              value={String(data.metrics.activeSubscriptions)}
            />
            <StatCard
              label="Total Minutes Used"
              value={data.metrics.totalMinutesUsed.toLocaleString() + " min"}
            />
            <StatCard
              label="Monthly Revenue (Active)"
              value={"$" + Number(data.metrics.totalRevenue).toLocaleString()}
            />
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold text-slate-900">Recent Signups</h3>
            {data.recentSignups.length === 0 ? (
              <EmptyState title="No signups yet" message="No customers have signed up yet." />
            ) : (
              <DataTable
                rows={data.recentSignups}
                columns={[
                  { key: "fullName", label: "Name" },
                  { key: "email", label: "Email" },
                  { key: "plan", label: "Plan" },
                  {
                    key: "createdAt",
                    label: "Signed Up",
                    render: (value) => formatDateTime(String(value)),
                  },
                ]}
              />
            )}
          </section>
        </div>
      )}
    </AdminPermissionGuard>
  );
}