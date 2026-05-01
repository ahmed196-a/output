import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AdminOperationsPage() {
  return (
    <AdminPermissionGuard allow={["operations"]}>
      <PlaceholderPage
        title="Operations Monitoring"
        description="n8n executions, provider health, and system incident monitoring will be implemented in the next admin phase."
      />
    </AdminPermissionGuard>
  );
}
