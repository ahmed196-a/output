import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { AdminCallLogsShell } from "@/components/admin/call-logs/admin-call-logs-shell";

export default function AdminCallMonitoringPage() {
  return (
    <AdminPermissionGuard allow={["call_monitoring"]}>
      <AdminCallLogsShell />
    </AdminPermissionGuard>
  );
}
