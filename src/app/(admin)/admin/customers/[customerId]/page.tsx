import { AdminCustomerDetailShell } from "@/components/admin/customers/admin-customer-detail-shell";

type AdminCustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function AdminCustomerDetailPage({ params }: AdminCustomerDetailPageProps) {
  const { customerId } = await params;

  return <AdminCustomerDetailShell customerId={customerId} />;
}
