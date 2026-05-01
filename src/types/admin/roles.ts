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
  | "agents"
  | "call_monitoring"
  | "recordings"
  | "billing"
  | "operations"
  | "support_tools"
  | "settings";

export const rolePermissions: Record<AdminRole, AdminNavPermission[]> = {
  super_admin: [
    "overview",
    "customers",
    "agents",
    "call_monitoring",
    "recordings",
    "billing",
    "operations",
    "support_tools",
    "settings"
  ],
  operations: ["overview", "customers", "agents", "call_monitoring", "recordings", "operations"],
  support: ["overview", "customers", "call_monitoring", "recordings", "support_tools"],
  finance: ["overview", "customers", "billing", "settings"]
};
