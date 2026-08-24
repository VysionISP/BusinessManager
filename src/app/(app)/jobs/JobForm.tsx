"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { JOB_STATUSES, JOB_STATUS_LABELS, PRICING_METHODS, PRICING_METHOD_LABELS } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";
import type { Job } from "@prisma/client";

interface CustomerOption {
  id: number;
  name: string;
}
interface SiteOption {
  id: number;
  name: string;
  customerId: number;
}
interface EmployeeOption {
  id: number;
  name: string;
}

const selectClasses =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function JobForm({
  job,
  customers,
  sites,
  employees,
  defaultCustomerId,
  action,
}: {
  job?: Job;
  customers: CustomerOption[];
  sites: SiteOption[];
  employees: EmployeeOption[];
  defaultCustomerId?: number;
  action: (formData: FormData) => void;
}) {
  const [customerId, setCustomerId] = useState<number>(job?.customerId ?? defaultCustomerId ?? customers[0]?.id ?? 0);
  const filteredSites = sites.filter((s) => s.customerId === customerId);

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Job number" name="jobNumber" defaultValue={job?.jobNumber} required />

        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Customer</span>
          {customers.length === 0 ? (
            <div className="mt-1 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm text-slate-500 dark:border-slate-700">
              No customers yet —{" "}
              <Link href="/customers/new" className="text-blue-600 hover:underline">
                add one first
              </Link>
              .
            </div>
          ) : (
            <select name="customerId" value={customerId} onChange={(e) => setCustomerId(Number(e.target.value))} className={selectClasses} required>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Site</span>
          <select name="siteId" defaultValue={job?.siteId ?? ""} className={selectClasses}>
            <option value="">No specific site (use billing address)</option>
            {filteredSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <FormField label="Customer order / PO number" name="customerOrderNumber" defaultValue={job?.customerOrderNumber ?? undefined} />

        <div className="sm:col-span-2">
          <FormField label="Description / scope" name="description" defaultValue={job?.description} required />
        </div>

        <FormField
          label="Status"
          name="status"
          defaultValue={job?.status ?? "LEAD"}
          options={JOB_STATUSES.map((s) => ({ value: s, label: JOB_STATUS_LABELS[s] }))}
        />
        <FormField
          label="Pricing method"
          name="pricingMethod"
          defaultValue={job?.pricingMethod ?? "FIXED_PRICE"}
          options={PRICING_METHODS.map((p) => ({ value: p, label: PRICING_METHOD_LABELS[p] }))}
        />

        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Project manager</span>
          <select name="projectManagerId" defaultValue={job?.projectManagerId ?? ""} className={selectClasses}>
            <option value="">Unassigned</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </label>

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
          <FormField
            label="Retention (%)"
            name="retentionPercent"
            type="number"
            step="0.5"
            defaultValue={job?.retentionPercent ?? 0}
            hint="Held back from progress claims on larger contracts"
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
