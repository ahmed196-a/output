// src/components/admin/customers/admin-customers-shell.tsx
"use client";

import { useMemo, useState } from "react";
import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { useAdminCustomersQuery } from "@/hooks/admin/use-admin-customers-query";
import { AdminCustomerEditModal } from "@/components/admin/customers/admin-customer-edit-modal";
import { AdminCustomer } from "@/types/admin/customer";
import { formatDateTime } from "@/utils/format";
import { Search, Pencil } from "lucide-react";

type StatusFilter = "all" | "active" | "inactive";

export function AdminCustomersShell() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingCustomer, setEditingCustomer] = useState<AdminCustomer | null>(null);

  const {
    data: customers = [],
    isLoading,
    error,
  } = useAdminCustomersQuery({
    search: query || undefined,
    status: statusFilter,
  });

  const filteredRows = useMemo(() => {
    const q = query.toLowerCase();
    return customers.filter((c) => {
      const match =
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.tenantId ?? "").toLowerCase().includes(q);
      const statusMatch =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? c.isActive
            : !c.isActive;
      return match && statusMatch;
    });
  }, [customers, query, statusFilter]);

  const tableRows = filteredRows.map((c) => ({
    id: c.id,
    _customer: c, // pass full customer for edit
    fullName: c.fullName,
    email: c.email,
    role: c.role,
    isActive: c.isActive,
    createdAt: c.createdAt,
  }));

  return (
    <AdminPermissionGuard allow={["customers"]}>
      <div className="space-y-6">
        <PageHeader
          title="Customers"
          description="All users with role owner or member."
        />

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, email, or tenant ID…"
              className="w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <LoadingSkeleton className="h-80 w-full" />
        ) : error ? (
          <ErrorState message="Customers could not be loaded." />
        ) : tableRows.length === 0 ? (
          <EmptyState
            title="No customers found"
            message="Try changing filters or search query."
          />
        ) : (
          <DataTable
            rows={tableRows}
            columns={[
              {
                key: "fullName",
                label: "Name",
                render: (v) => (
                  <span className="font-medium text-slate-900">
                    {String(v)}
                  </span>
                ),
              },
              { key: "email", label: "Email" },
              {
                key: "role",
                label: "Role",
                render: (v) => (
                  <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-indigo-50 text-indigo-600">
                    {String(v)}
                  </span>
                ),
              },
              {
                key: "isActive",
                label: "Account",
                render: (v) => (
                  <StatusBadge
                    text={v ? "Active" : "Inactive"}
                    variant={v ? "success" : "neutral"}
                  />
                ),
              },
              {
                key: "createdAt",
                label: "Joined",
                render: (v) => formatDateTime(String(v)),
              },
              {
                key: "_customer",
                label: "Actions",
                render: (v) => (
                  <button
                    onClick={() => setEditingCustomer(v as AdminCustomer)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                ),
              },
            ]}
          />
        )}
      </div>

      {/* Edit Modal */}
      {editingCustomer && (
        <AdminCustomerEditModal
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
        />
      )}
    </AdminPermissionGuard>
  );
}
