export type AdminRole = "super_admin" | "operations" | "support" | "finance";

export const adminRoleLabels: Record<AdminRole, string> = {
  super_admin: "Super Admin",
  operations: "Operations",
  support: "Support",
  finance: "Finance"
};

export type AdminNavPermission =
  | "overview"
  | "customers"
  | "plans"
  | "subscriptions"
  | "agents"
  | "billing";

export const rolePermissions: Record<AdminRole, AdminNavPermission[]> = {
  super_admin: ["overview", "customers", "plans", "subscriptions", "billing","agents"],
  operations: ["overview", "customers", "subscriptions","agents"],
  support: ["overview", "customers"],
  finance: ["overview", "customers", "billing", "plans", "subscriptions"]
};