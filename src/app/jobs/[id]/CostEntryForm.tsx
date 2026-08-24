import { FormField } from "@/components/FormField";
import { JOB_COST_CATEGORIES } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  LABOUR: "Labour",
  MATERIALS: "Materials",
  SUBCONTRACTOR: "Subcontractor",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
};

export function CostEntryForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
      <FormField label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
      <FormField
        label="Category"
        name="category"
        defaultValue="LABOUR"
        options={JOB_COST_CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }))}
      />
      <div className="col-span-2 sm:col-span-2">
        <FormField label="Description" name="description" required />
      </div>
      <FormField label="Hours" name="hours" type="number" step="0.5" hint="Labour only" />
      <FormField label="Amount ($)" name="amount" type="number" step="0.01" required />
      <button type="submit" className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-1">
        Add
      </button>
    </form>
  );
}
