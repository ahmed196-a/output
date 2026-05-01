import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { AdminRetellAgentsShell } from "@/components/admin/agents/admin-retell-agents-shell";

export default function AdminAgentsPage() {
  return (
    <AdminPermissionGuard allow={["agents"]}>
      <AdminRetellAgentsShell />
    </AdminPermissionGuard>
  );
}
