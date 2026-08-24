import { FormField } from "@/components/FormField";
import { formatCurrency, formatDate } from "@/lib/format";
import type { JobCostEntry } from "@prisma/client";

const CATEGORY_LABELS: Record<string, string> = {
  LABOUR: "Labour",
  MATERIALS: "Materials",
  SUBCONTRACTOR: "Subcontractor",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
};

export function ChargeUpInvoiceForm({ unbilledEntries, action }: { unbilledEntries: JobCostEntry[]; action: (formData: FormData) => void }) {
  const total = unbilledEntries.reduce((sum, e) => sum + e.amount, 0);

  if (unbilledEntries.length === 0) {
    return <p className="text-sm text-slate-400">No unbilled costs — every actual cost has been pulled onto a charge-up invoice.</p>;
  }

  return (
    <form action={action} className="space-y-4">
      <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-100 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="sticky top-0 bg-white dark:bg-slate-900">
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pl-3 pr-2">
                <input type="checkbox" onChange={(e) => {
                  const form = e.currentTarget.closest("form");
                  form?.querySelectorAll<HTMLInputElement>('input[name="costEntryIds"]').forEach((cb) => (cb.checked = e.currentTarget.checked));
                }} />
              </th>
              <th className="py-2 pr-4">Date</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4">Amount</th>
            </tr>
          </thead>
          <tbody>
            {unbilledEntries.map((e) => (
              <tr key={e.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                <td className="py-2 pl-3 pr-2">
                  <input type="checkbox" name="costEntryIds" value={e.id} defaultChecked />
                </td>
                <td className="py-2 pr-4">{formatDate(e.date)}</td>
                <td className="py-2 pr-4">{CATEGORY_LABELS[e.category] ?? e.category}</td>
                <td className="py-2 pr-4">{e.description}</td>
                <td className="py-2 pr-4">{formatCurrency(e.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-400">Unbilled cost total: {formatCurrency(total)}</p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormField label="Invoice #" name="invoiceNumber" />
        <FormField label="Markup (%)" name="markupPercent" type="number" step="0.5" defaultValue={20} />
        <FormField label="Issue date" name="issueDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <FormField label="Due date" name="dueDate" type="date" />
      </div>
      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Create charge-up invoice from selected costs
      </button>
    </form>
  );
}
