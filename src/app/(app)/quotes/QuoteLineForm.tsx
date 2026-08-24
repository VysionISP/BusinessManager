import { FormField } from "@/components/FormField";

export function QuoteLineForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-7 sm:items-end">
      <FormField label="Section" name="section" hint="e.g. Switchboards" />
      <div className="col-span-2">
        <FormField label="Description" name="description" required />
      </div>
      <FormField label="Qty" name="quantity" type="number" step="0.01" defaultValue={1} />
      <FormField label="Unit" name="unit" defaultValue="item" />
      <FormField label="Unit cost ($)" name="unitCost" type="number" step="0.01" defaultValue={0} />
      <FormField label="Unit price ($)" name="unitPrice" type="number" step="0.01" defaultValue={0} />
      <button
        type="submit"
        className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-1"
      >
        Add line
      </button>
    </form>
  );
}
