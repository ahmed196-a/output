import { StatusBadge } from "@/components/shared/status-badge";
import { Invoice } from "@/types/billing";
import { getInvoiceStatusVariant } from "@/utils/status";

type InvoiceSummaryCardProps = {
  invoices: Invoice[];
};

export function InvoiceSummaryCard({ invoices }: InvoiceSummaryCardProps) {
  return (
    <article className="rounded-xl border bg-white p-5 shadow-sm">
      <h3 className="text-base font-semibold text-slate-900">Recent Invoices</h3>
      <div className="mt-4 space-y-3">
        {invoices.map((invoice) => (
          <div key={invoice.id} className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium text-slate-900">{invoice.period}</p>
              <p className="text-xs text-slate-500">{invoice.amount}</p>
            </div>
            <StatusBadge
              text={invoice.status}
              variant={getInvoiceStatusVariant(invoice.status)}
            />
          </div>
        ))}
      </div>
    </article>
  );
}
