import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AdminSettingsPage() {
  return (
    <AdminPermissionGuard allow={["settings"]}>
      <PlaceholderPage
        title="Admin Settings"
        description="Admin settings, policy controls, and platform configuration will be implemented in the next admin phase."
      />
    </AdminPermissionGuard>
  );
}
