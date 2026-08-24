import { FormField } from "@/components/FormField";
import { PHASE_STATUSES, PHASE_STATUS_LABELS } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";
import type { JobPhase } from "@prisma/client";

export function PhaseForm({ phase, action, submitLabel = "Add phase" }: { phase?: JobPhase; action: (formData: FormData) => void; submitLabel?: string }) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div className="col-span-2 sm:col-span-2">
        <FormField label="Phase name" name="name" defaultValue={phase?.name} required hint="e.g. Phase A — Rough-in" />
      </div>
      <FormField
        label="Status"
        name="status"
        defaultValue={phase?.status ?? "PENDING"}
        options={PHASE_STATUSES.map((s) => ({ value: s, label: PHASE_STATUS_LABELS[s] }))}
      />
      {phase && <FormField label="% complete" name="percentComplete" type="number" step="5" defaultValue={phase.percentComplete} />}
      <div className="col-span-2 sm:col-span-4">
        <FormField label="Description" name="description" defaultValue={phase?.description ?? undefined} />
      </div>
      <FormField label="Scheduled start" name="scheduledStart" type="date" defaultValue={toDateInputValue(phase?.scheduledStart)} />
      <FormField label="Scheduled end" name="scheduledEnd" type="date" defaultValue={toDateInputValue(phase?.scheduledEnd)} />
      <FormField label="Budget labour hrs" name="budgetLabourHours" type="number" step="1" defaultValue={phase?.budgetLabourHours ?? 0} />
      <FormField label="Budget labour ($)" name="budgetLabourCost" type="number" step="0.01" defaultValue={phase?.budgetLabourCost ?? 0} />
      <FormField label="Budget materials ($)" name="budgetMaterials" type="number" step="0.01" defaultValue={phase?.budgetMaterials ?? 0} />
      <FormField label="Budget subs ($)" name="budgetSubcontractors" type="number" step="0.01" defaultValue={phase?.budgetSubcontractors ?? 0} />
      <FormField label="Budget other ($)" name="budgetOtherDirectCosts" type="number" step="0.01" defaultValue={phase?.budgetOtherDirectCosts ?? 0} />
      <div className="col-span-2 sm:col-span-4">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
