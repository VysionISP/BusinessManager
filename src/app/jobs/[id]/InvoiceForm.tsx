import { FormField } from "@/components/FormField";
import { INVOICE_TYPES } from "@/lib/types";

const TYPE_LABELS: Record<string, string> = { DEPOSIT: "Deposit", PROGRESS: "Progress claim", FINAL: "Final" };

export function InvoiceForm({ action }: { action: (formData: FormData) => void }) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
      <FormField label="Invoice #" name="invoiceNumber" required />
      <FormField label="Type" name="type" defaultValue="PROGRESS" options={INVOICE_TYPES.map((t) => ({ value: t, label: TYPE_LABELS[t] }))} />
      <FormField label="Issue date" name="issueDate" type="date" defaultValue={today} required />
      <FormField label="Due date" name="dueDate" type="date" defaultValue={today} required />
      <FormField label="Amount ($)" name="amount" type="number" step="0.01" required />
      <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
        Add invoice
      </button>
    </form>
  );
}
