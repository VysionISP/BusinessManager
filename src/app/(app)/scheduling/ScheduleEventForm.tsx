"use client";

import { useState } from "react";
import { FormField } from "@/components/FormField";
import { SCHEDULE_EVENT_TYPES, SCHEDULE_EVENT_TYPE_LABELS } from "@/lib/types";

interface JobOption {
  id: number;
  jobNumber: string;
  customerName: string;
  siteId: number | null;
  phases: { id: number; name: string }[];
}
interface EmployeeOption {
  id: number;
  name: string;
}

const selectClasses =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

function defaultDateTime(hourOffset = 0): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + hourOffset);
  return d.toISOString().slice(0, 16);
}

export function ScheduleEventForm({
  action,
  jobs,
  employees,
}: {
  action: (formData: FormData) => void;
  jobs: JobOption[];
  employees: EmployeeOption[];
}) {
  const [jobId, setJobId] = useState<string>("");
  const selectedJob = jobs.find((j) => String(j.id) === jobId);

  return (
    <form action={action} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
      <label className="block text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Job</span>
        <select name="jobId" value={jobId} onChange={(e) => setJobId(e.target.value)} className={selectClasses}>
          <option value="">No specific job</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.jobNumber} — {j.customerName}
            </option>
          ))}
        </select>
      </label>

      {selectedJob && selectedJob.phases.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Phase</span>
          <select name="phaseId" defaultValue="" className={selectClasses}>
            <option value="">Whole job</option>
            {selectedJob.phases.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-300">Employee</span>
        <select name="employeeId" className={selectClasses}>
          <option value="">Unassigned</option>
          {employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </label>

      <FormField
        label="Type"
        name="eventType"
        defaultValue="WORK"
        options={SCHEDULE_EVENT_TYPES.map((t) => ({ value: t, label: SCHEDULE_EVENT_TYPE_LABELS[t] }))}
      />

      <div className="col-span-2">
        <FormField label="Title" name="title" required hint="e.g. Switchboard rough-in" />
      </div>
      <FormField label="Start" name="startAt" type="datetime-local" defaultValue={defaultDateTime(8)} required />
      <FormField label="End" name="endAt" type="datetime-local" defaultValue={defaultDateTime(16)} required />

      <div className="col-span-2 sm:col-span-3">
        <FormField label="Notes" name="notes" />
      </div>
      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Schedule
      </button>
    </form>
  );
}
