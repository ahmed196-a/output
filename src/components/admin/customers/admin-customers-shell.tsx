"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminCustomersQuery } from "@/hooks/admin/use-admin-customers-query";
import { AdminCustomer } from "@/types/admin/customer";
import { formatDateTime } from "@/utils/format";

export function AdminCustomersShell() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AdminCustomer["status"]>("all");
  const { data: customers = [], isLoading, error } = useAdminCustomersQuery({
    search: query || undefined,
    status: statusFilter
  });

  const filteredRows = useMemo(() => {
    return customers.filter((customer) => {
      const queryMatch =
        customer.companyName.toLowerCase().includes(query.toLowerCase()) ||
        customer.contactEmail.toLowerCase().includes(query.toLowerCase());
      const statusMatch = statusFilter === "all" ? true : customer.status === statusFilter;
      return queryMatch && statusMatch;
    });
  }, [customers, query, statusFilter]);

  return (
    <AdminPermissionGuard allow={["customers"]}>
      <div className="space-y-6">
        <PageHeader
          title="Customers Management"
          description="Search and inspect tenants, subscriptions, usage, billing state, and account activity."
        />

        <FilterBar>
          <div className="w-full md:max-w-md">
            <SearchInput value={query} onChange={setQuery} placeholder="Search company or contact email" />
          </div>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | AdminCustomer["status"])}
            className="rounded-lg border bg-white px-3 py-2 text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="flagged">Flagged</option>
          </select>
        </FilterBar>

        {isLoading ? (
          <LoadingSkeleton className="h-80 w-full" />
        ) : error ? (
          <ErrorState message="Customers could not be loaded." />
        ) : filteredRows.length === 0 ? (
          <EmptyState title="No customers found" message="Try changing filters or search query." />
        ) : (
          <DataTable
            rows={filteredRows}
            columns={[
              {
                key: "companyName",
                label: "Customer",
                render: (_, row) => (
                  <Link href={`/admin/customers/${row.id}`} className="font-medium text-slate-900 hover:underline">
                    {row.companyName}
                  </Link>
                )
              },
              { key: "contactEmail", label: "Contact" },
              {
                key: "status",
                label: "Account",
                render: (value) => (
                  <StatusBadge
                    text={String(value)}
                    variant={
                      String(value) === "active" ? "success" : String(value) === "flagged" ? "danger" : "warning"
                    }
                  />
                )
              },
              {
                key: "subscriptionStatus",
                label: "Subscription",
                render: (value) => (
                  <StatusBadge
                    text={String(value)}
                    variant={
                      String(value) === "active" ? "success" : String(value) === "past_due" ? "danger" : "warning"
                    }
                  />
                )
              },
              { key: "assignedAgents", label: "Agents" },
              { key: "monthlyUsageMinutes", label: "Monthly Usage (min)" },
              { key: "openInvoices", label: "Open Invoices" },
              {
                key: "lastActivityAt",
                label: "Last Activity",
                render: (value) => formatDateTime(String(value))
              }
            ]}
          />
        )}
      </div>
    </AdminPermissionGuard>
  );
}
