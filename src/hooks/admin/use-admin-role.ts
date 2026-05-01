"use client";

import { useMemo } from "react";
import { useAuthStore } from "@/store/auth-store";
import {
  AdminNavPermission,
  AdminRole,
  rolePermissions,
} from "@/types/admin/roles";

/**
 * Reads the authenticated user's role from the Zustand auth store and
 * returns their set of admin nav permissions.
 *
 * - Only roles defined in AdminRole (super_admin | operations | support | finance)
 *   are allowed inside /admin.  Any other role falls back to an empty permission
 *   set so the AdminPermissionGuard blocks access client-side too.
 */
export function useAdminRole() {
  const user = useAuthStore((s) => s.user);

  const role: AdminRole = useMemo(() => {
    const validAdminRoles: AdminRole[] = [
      "super_admin",
      "operations",
      "support",
      "finance",
    ];
    const userRole = user?.role as AdminRole | undefined;
    return userRole && validAdminRoles.includes(userRole)
      ? userRole
      : "support"; // lowest-privilege fallback (empty-ish permissions)
  }, [user?.role]);

  return useMemo(() => {
    const permissions: AdminNavPermission[] = rolePermissions[role] ?? [];
    return {
      role,
      permissions,
      hasPermission: (p: AdminNavPermission) => permissions.includes(p),
    };
  }, [role]);
}
