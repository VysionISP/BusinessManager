import { FormField } from "@/components/FormField";
import { INVOICE_TYPES } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = { DEPOSIT: "Deposit", PROGRESS: "Progress claim", FINAL: "Final" };

export function InvoiceForm({ action }: { action: (formData: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <FormField label="Invoice #" name="invoiceNumber" required />
      <FormField label="Type" name="type" defaultValue="PROGRESS" options={INVOICE_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))} />
      <FormField label="Issue date" name="issueDate" type="date" defaultValue={today} required />
      <FormField label="Due date" name="dueDate" type="date" defaultValue={today} required />
      <div className="col-span-2 sm:col-span-2">
        <FormField label="First line — description" name="description" hint="Optional — leave blank to raise a blank invoice and add lines after" />
      </div>
      <FormField label="Qty" name="quantity" type="number" step="0.01" defaultValue={1} />
      <FormField label="UoM" name="unit" defaultValue="item" />
      <FormField label="Unit price ($)" name="unitPrice" type="number" step="0.01" defaultValue={0} />
      <FormField label="Tax (%)" name="taxPercent" type="number" step="0.1" defaultValue={0} />
      <button
        type="submit"
        className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-1"
      >
        Add invoice
      </button>
    </form>
  );
}
