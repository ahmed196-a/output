import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AdminSupportToolsPage() {
  return (
    <AdminPermissionGuard allow={["support_tools"]}>
      <PlaceholderPage
        title="Support Tools"
        description="Impersonation flow, internal notes, issue tags, and account flags will be implemented in the next admin phase."
      />
    </AdminPermissionGuard>
  );
}
