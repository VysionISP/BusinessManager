import { FormField } from "@/components/FormField";
import { PRICING_METHODS, PRICING_METHOD_LABELS } from "@/lib/types";

interface CustomerOption {
  id: number;
  name: string;
}

export function RecurringTemplateForm({ action, customers }: { action: (formData: FormData) => void; customers: CustomerOption[] }) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <FormField label="Template name" name="name" required hint="e.g. Annual emergency-light test" />
      <FormField label="Customer" name="customerId" options={customers.map((c) => ({ value: String(c.id), label: c.name }))} />
      <FormField label="Frequency (months)" name="frequencyMonths" type="number" defaultValue={12} />
      <FormField label="Next due date" name="nextDueDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      <div className="col-span-2 sm:col-span-4">
        <FormField label="Job description template" name="jobDescriptionTemplate" required />
      </div>
      <FormField
        label="Pricing method"
        name="pricingMethod"
        defaultValue="FIXED_PRICE"
        options={PRICING_METHODS.map((p) => ({ value: p, label: PRICING_METHOD_LABELS[p] }))}
      />
      <FormField label="Default quote amount ($)" name="defaultQuoteAmount" type="number" step="0.01" defaultValue={0} />
      <div className="col-span-2 sm:col-span-4">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          Add recurring template
        </button>
      </div>
    </form>
  );
}
