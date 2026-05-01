import { AdminSidebar } from "@/components/admin/shared/admin-sidebar";
import { AdminTopHeader } from "@/components/admin/shared/admin-top-header";

export default function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopHeader title="Internal Admin Panel" />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
