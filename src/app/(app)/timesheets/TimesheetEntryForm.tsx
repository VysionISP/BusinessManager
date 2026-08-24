import { FormField } from "@/components/FormField";
import { toDateInputValue } from "@/lib/format";
import { TIMESHEET_KINDS, TIMESHEET_KIND_LABELS } from "@/lib/types";
import type { TimesheetEntry } from "@prisma/client";

export function TimesheetEntryForm({
  entry,
  defaultDate,
  jobs,
  action,
  submitLabel = "Add time",
}: {
  entry?: TimesheetEntry;
  defaultDate?: Date;
  jobs: { id: number; jobNumber: string; description: string }[];
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
      <FormField label="Date" name="date" type="date" defaultValue={toDateInputValue(entry?.date ?? defaultDate)} required />
      <FormField label="Hours" name="hours" type="number" step="0.25" defaultValue={entry?.hours ?? ""} required />
      <FormField
        label="Type"
        name="kind"
        defaultValue={entry?.kind ?? "ORDINARY"}
        options={TIMESHEET_KINDS.map((k) => ({ value: k, label: TIMESHEET_KIND_LABELS[k] }))}
      />
      <label className="block text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Job</span>
        <select
          name="jobId"
          defaultValue={entry?.jobId ?? ""}
          className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        >
          <option value="">— No job (internal)</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.jobNumber} — {j.description.slice(0, 40)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 pb-2.5 text-sm">
        <input type="checkbox" name="billable" defaultChecked={entry ? entry.billable : true} className="h-4 w-4 rounded border-slate-300" />
        <span className="font-medium text-slate-700 dark:text-slate-300">Billable</span>
      </label>
      <div className="col-span-2 sm:col-span-4">
        <FormField label="Notes" name="notes" defaultValue={entry?.notes ?? undefined} />
      </div>
      <div className="col-span-2 sm:col-span-2">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
