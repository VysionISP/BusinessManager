"use client";

import { useState } from "react";
import { FormField } from "@/components/FormField";

interface JobOption {
  id: number;
  jobNumber: string;
  customerName: string;
}
interface PhaseOption {
  id: number;
  name: string;
  jobId: number;
}
interface SupplierOption {
  id: number;
  name: string;
}

const selectClasses =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function PurchaseOrderForm({
  action,
  jobs,
  phases,
  suppliers,
  defaultJobId,
}: {
  action: (formData: FormData) => void;
  jobs: JobOption[];
  phases: PhaseOption[];
  suppliers: SupplierOption[];
  defaultJobId?: number;
}) {
  const [jobId, setJobId] = useState<number>(defaultJobId ?? jobs[0]?.id ?? 0);
  const filteredPhases = phases.filter((p) => p.jobId === jobId);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Job</span>
          <select name="jobId" value={jobId} onChange={(e) => setJobId(Number(e.target.value))} className={selectClasses} required>
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.jobNumber} — {j.customerName}
              </option>
            ))}
          </select>
        </label>

        {filteredPhases.length > 0 && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Phase (optional)</span>
            <select name="phaseId" defaultValue="" className={selectClasses}>
              <option value="">Whole job</option>
              {filteredPhases.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Supplier</span>
          <select name="supplierId" className={selectClasses} required>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <FormField label="Requested by" name="requestedBy" />
        <FormField label="Required date" name="requiredDate" type="date" />
        <FormField label="Delivery address" name="deliveryAddress" />
      </div>

      <FormField label="Instructions" name="instructions" />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">First line item</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="col-span-2">
            <FormField label="Description" name="description" required />
          </div>
          <FormField label="Quantity" name="quantity" type="number" step="0.01" defaultValue={1} />
          <FormField label="Unit cost ($)" name="unitCost" type="number" step="0.01" defaultValue={0} />
        </div>
      </div>

      <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
        Create purchase order
      </button>
    </form>
  );
}
