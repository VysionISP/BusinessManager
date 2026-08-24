import { FormField } from "@/components/FormField";

export function VariationForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FormField label="Title" name="title" required hint="e.g. Additional power circuit — home office" />
        <FormField label="Requested by" name="requestedBy" />
      </div>
      <FormField label="Scope" name="scope" required />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormField label="Reason" name="reason" />
        <FormField label="Request date" name="requestDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
        <FormField label="Markup (%)" name="markupPercent" type="number" step="0.5" defaultValue={20} />
        <FormField label="Manual sell price ($)" name="sellPriceOverride" type="number" step="0.01" hint="Leave blank to use cost + markup" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <FormField label="Labour allowance ($)" name="labourAllowance" type="number" step="0.01" defaultValue={0} />
        <FormField label="Material allowance ($)" name="materialAllowance" type="number" step="0.01" defaultValue={0} />
        <FormField label="Subcontractor allowance ($)" name="subcontractorAllowance" type="number" step="0.01" defaultValue={0} />
        <FormField label="Other allowance ($)" name="otherAllowance" type="number" step="0.01" defaultValue={0} />
      </div>
      <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
        Add variation
      </button>
    </form>
  );
}
