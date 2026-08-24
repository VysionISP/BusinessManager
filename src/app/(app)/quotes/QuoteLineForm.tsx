import { FormField } from "@/components/FormField";

export function QuoteLineForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-8 sm:items-end">
      <div className="col-span-2 sm:col-span-2">
        <FormField label="Description" name="description" required />
      </div>
      <FormField label="Qty" name="quantity" type="number" step="0.01" defaultValue={1} />
      <FormField label="UoM" name="unit" defaultValue="item" />
      <FormField label="Cost ($)" name="unitCost" type="number" step="0.01" defaultValue={0} />
      <FormField label="Price ($)" name="unitPrice" type="number" step="0.01" defaultValue={0} />
      <FormField label="Tax (%)" name="taxPercent" type="number" step="0.1" defaultValue={0} />
      <FormField label="Discount (%)" name="discountPercent" type="number" step="0.1" defaultValue={0} />
      <button
        type="submit"
        className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-1"
      >
        Add line
      </button>
    </form>
  );
}
