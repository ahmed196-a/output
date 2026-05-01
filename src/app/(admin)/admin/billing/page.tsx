import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AdminBillingPage() {
  return (
    <AdminPermissionGuard allow={["billing"]}>
      <PlaceholderPage
        title="Admin Billing"
        description="Cross-tenant billing and finance operations will be implemented in the next admin phase."
      />
    </AdminPermissionGuard>
  );
}
