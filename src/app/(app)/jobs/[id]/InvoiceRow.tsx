import { TrafficBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceLinesTotal, type InvoiceSummary } from "@/lib/calculations";
import type { InvoiceLine } from "@prisma/client";
import { InvoiceLineForm } from "./InvoiceLineForm";
import { InvoiceLineRow } from "./InvoiceLineRow";

const TYPE_LABELS: Record<string, string> = { DEPOSIT: "Deposit", PROGRESS: "Progress claim", FINAL: "Final" };

export function InvoiceRow({
  invoice,
  lines,
  payments,
  addPaymentAction,
  deletePaymentAction,
  deleteInvoiceAction,
  addLineAction,
  updateLineAction,
  deleteLineAction,
  moveLineAction,
}: {
  invoice: InvoiceSummary;
  lines: InvoiceLine[];
  payments: { id: number; date: Date; amount: number }[];
  addPaymentAction: (formData: FormData) => void;
  deletePaymentAction: (paymentId: number) => void;
  deleteInvoiceAction: () => void;
  addLineAction: (formData: FormData) => void;
  updateLineAction: (lineId: number, formData: FormData) => Promise<void>;
  deleteLineAction: (lineId: number) => void;
  moveLineAction: (lineId: number, direction: "up" | "down") => void;
}) {
  const sortedLines = [...lines].sort((a, b) => a.sortOrder - b.sortOrder);
  const linesTotal = invoiceLinesTotal(sortedLines);

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

      <details className="mt-3" open={sortedLines.length > 0}>
        <summary className="cursor-pointer text-xs font-medium text-indigo-600">
          Line items ({sortedLines.length})
        </summary>
        <div className="mt-2">
          <Table>
            <THead>
              <Th>Description</Th>
              <Th>Qty</Th>
              <Th>UoM</Th>
              <Th>Unit price</Th>
              <Th>Tax</Th>
              <Th>Total</Th>
              <Th />
            </THead>
            <tbody>
              {sortedLines.map((line, i) => (
                <InvoiceLineRow
                  key={line.id}
                  line={line}
                  canMoveUp={i > 0}
                  canMoveDown={i < sortedLines.length - 1}
                  updateAction={updateLineAction.bind(null, line.id)}
                  deleteAction={deleteLineAction.bind(null, line.id)}
                  moveAction={moveLineAction.bind(null, line.id)}
                />
              ))}
              {sortedLines.length === 0 && <EmptyRow colSpan={7}>No line items yet.</EmptyRow>}
            </tbody>
            {sortedLines.length > 0 && (
              <tfoot>
                <Tr className="hover:bg-transparent dark:hover:bg-transparent">
                  <Td colSpan={5} className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    Total
                  </Td>
                  <Td className="font-semibold">{formatCurrency(linesTotal)}</Td>
                  <Td />
                </Tr>
              </tfoot>
            )}
          </Table>
          <div className="mt-3">
            <InvoiceLineForm action={addLineAction} />
          </div>
        </div>
      </details>

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
