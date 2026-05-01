import { AdminPermissionGuard } from "@/components/admin/shared/admin-permission-guard";
import { PlaceholderPage } from "@/components/shared/placeholder-page";

export default function AdminRecordingsPage() {
  return (
    <AdminPermissionGuard allow={["recordings"]}>
      <PlaceholderPage
        title="Admin Recordings"
        description="Global recordings review and failure analysis will be implemented in the next admin phase."
      />
    </AdminPermissionGuard>
  );
}
