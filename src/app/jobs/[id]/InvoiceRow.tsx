import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import type { InvoiceSummary } from "@/lib/calculations";

const TYPE_LABELS: Record<string, string> = { DEPOSIT: "Deposit", PROGRESS: "Progress claim", FINAL: "Final" };

export function InvoiceRow({
  invoice,
  payments,
  addPaymentAction,
  deletePaymentAction,
  deleteInvoiceAction,
}: {
  invoice: InvoiceSummary;
  payments: { id: number; date: Date; amount: number }[];
  addPaymentAction: (formData: FormData) => void;
  deletePaymentAction: (paymentId: number) => void;
  deleteInvoiceAction: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-100 p-4 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="font-medium">{invoice.invoiceNumber}</span>{" "}
          <span className="text-xs text-slate-500 dark:text-slate-400">({TYPE_LABELS[invoice.type] ?? invoice.type})</span>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm">{formatCurrency(invoice.amount)}</span>
          {invoice.outstanding > 0.005 ? (
            <TrafficBadge
              severity={invoice.daysOverdue > 0 ? "red" : "orange"}
              label={invoice.daysOverdue > 0 ? `${formatCurrency(invoice.outstanding)} · ${invoice.daysOverdue}d overdue` : `${formatCurrency(invoice.outstanding)} outstanding`}
            />
          ) : (
            <TrafficBadge severity="green" label="Paid in full" />
          )}
          <form action={deleteInvoiceAction}>
            <button type="submit" className="text-xs text-rose-600 hover:underline">
              Delete
            </button>
          </form>
        </div>
      </div>

      {payments.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-slate-500 dark:text-slate-400">
          {payments.map((p) => (
            <li key={p.id} className="flex items-center justify-between">
              <span>
                Payment received {formatDate(p.date)} — {formatCurrency(p.amount)}
              </span>
              <form action={deletePaymentAction.bind(null, p.id)}>
                <button type="submit" className="text-rose-500 hover:underline">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {invoice.outstanding > 0.005 && (
        <form action={addPaymentAction} className="mt-3 flex flex-wrap items-end gap-2 text-xs">
          <label>
            <span className="block text-slate-500 dark:text-slate-400">Payment date</span>
            <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
          </label>
          <label>
            <span className="block text-slate-500 dark:text-slate-400">Amount ($)</span>
            <input type="number" step="0.01" name="amount" defaultValue={invoice.outstanding.toFixed(2)} required className="w-28 rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800" />
          </label>
          <button type="submit" className="rounded-md bg-emerald-600 px-3 py-1.5 font-medium text-white hover:bg-emerald-700">
            Record payment
          </button>
        </form>
      )}
    </div>
  );
}
