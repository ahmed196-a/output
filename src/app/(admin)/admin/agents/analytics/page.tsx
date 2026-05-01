import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { AdminAgentsAnalyticsShell } from "@/components/admin/agents/admin-agents-analytics-shell";

export default function AdminAgentsAnalyticsPage() {
  return (
    <AdminPermissionGuard allow={["agents"]}>
      <AdminAgentsAnalyticsShell />
    </AdminPermissionGuard>
  );
}
