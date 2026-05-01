"use client";

import type { ReactNode } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { useAdminRole } from "@/hooks/admin/use-admin-role";
import { AdminNavPermission } from "@/types/admin/roles";

type AdminPermissionGuardProps = {
  allow: AdminNavPermission[];
  children: ReactNode;
};

export function AdminPermissionGuard({ allow, children }: AdminPermissionGuardProps) {
  const { hasPermission } = useAdminRole();
  const allowed = allow.some((permission) => hasPermission(permission));

  if (!allowed) {
    return (
      <EmptyState
        title="Permission required"
        message="Your admin role does not have access to this section. Contact a super admin if needed."
      />
    );
  }

  return <>{children}</>;
}
