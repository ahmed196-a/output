"use client";

import { CallTrendsChart } from "@/components/dashboard/call-trends-chart";
import { RecentCallLogsTable } from "@/components/dashboard/recent-call-logs-table";
import { ChartCard } from "@/components/shared/chart-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { useDashboardOverviewQuery } from "@/hooks/use-dashboard-query";

export function DashboardShell() {
  const { data, isLoading, error } = useDashboardOverviewQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSkeleton className="h-24 w-full" />
        <LoadingSkeleton className="h-40 w-full" />
        <LoadingSkeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message="Dashboard data could not be loaded. Please try again." />;
  }

  if (!data) {
    return <EmptyState title="No dashboard data" message="No dashboard metrics are available yet." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Operational overview for calls and AI agent performance."
      />

      {/* KPI stat cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {data.kpis.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} change={item.change} />
        ))}
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-1">
        <ChartCard title="Call Trends" subtitle="Last 7 days total and answered calls">
          <CallTrendsChart data={data.trends} />
        </ChartCard>
      </section>

      {/* Recent call logs */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider" style={{ color: "#6366f1", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Recent Call Logs</h3>
        <RecentCallLogsTable rows={data.recentCallLogs} />
      </section>
    </div>
  );
}
