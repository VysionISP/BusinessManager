import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { JOB_STATUSES, JOB_STATUS_LABELS } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";
import type { Job } from "@prisma/client";

export function JobForm({ job, action }: { job?: Job; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Job number" name="jobNumber" defaultValue={job?.jobNumber} required />
        <FormField label="Customer" name="customerName" defaultValue={job?.customerName} required />
        <FormField label="Description" name="description" defaultValue={job?.description} required />
        <FormField
          label="Status"
          name="status"
          defaultValue={job?.status ?? "LEAD"}
          options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] }))}
        />
        <FormField label="Quote date" name="quoteDate" type="date" defaultValue={toDateInputValue(job?.quoteDate)} />
        <FormField label="Start date" name="startDate" type="date" defaultValue={toDateInputValue(job?.startDate)} />
        <FormField label="Expected completion" name="expectedCompletionDate" type="date" defaultValue={toDateInputValue(job?.expectedCompletionDate)} />
        <FormField label="% complete" name="percentComplete" type="number" step="1" defaultValue={job?.percentComplete ?? 0} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Original budget / quote</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <FormField label="Quote amount ($)" name="quoteAmount" type="number" step="0.01" defaultValue={job?.quoteAmount ?? 0} required />
          <FormField label="Budget labour hours" name="budgetLabourHours" type="number" step="1" defaultValue={job?.budgetLabourHours ?? 0} />
          <FormField label="Budget labour cost ($)" name="budgetLabourCost" type="number" step="0.01" defaultValue={job?.budgetLabourCost ?? 0} />
          <FormField label="Budget materials ($)" name="budgetMaterials" type="number" step="0.01" defaultValue={job?.budgetMaterials ?? 0} />
          <FormField label="Budget subcontractors ($)" name="budgetSubcontractors" type="number" step="0.01" defaultValue={job?.budgetSubcontractors ?? 0} />
          <FormField label="Budget other direct ($)" name="budgetOtherDirectCosts" type="number" step="0.01" defaultValue={job?.budgetOtherDirectCosts ?? 0} />
          <FormField
            label="Target margin override (%)"
            name="targetMarginPercent"
            type="number"
            step="0.5"
            defaultValue={job?.targetMarginPercent ?? undefined}
            hint="Leave blank to use the business default"
          />
        </div>
      </div>

      <FormActions>
        <Button>Save job</Button>
        <Link href="/jobs" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
