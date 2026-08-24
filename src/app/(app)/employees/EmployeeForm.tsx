import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { EMPLOYEE_TYPES, PAY_TYPES } from "@/lib/types";
import type { Employee } from "@prisma/client";

export function EmployeeForm({
  employee,
  action,
}: {
  employee?: Employee;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" defaultValue={employee?.name} required />
        <FormField label="Role" name="role" defaultValue={employee?.role} required hint="e.g. Licensed Electrician, Apprentice, Office Manager" />
        <FormField
          label="Employee / subcontractor"
          name="employeeType"
          defaultValue={employee?.employeeType ?? "EMPLOYEE"}
          options={EMPLOYEE_TYPES.map((t) => ({ value: t, label: t === "EMPLOYEE" ? "Employee" : "Subcontractor" }))}
        />
        <FormField
          label="Hourly or salary"
          name="payType"
          defaultValue={employee?.payType ?? "HOURLY"}
          options={PAY_TYPES.map((t) => ({ value: t, label: t === "HOURLY" ? "Hourly" : "Salary" }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField label="Base hourly rate ($)" name="baseHourlyRate" type="number" step="0.01" defaultValue={employee?.baseHourlyRate ?? 0} />
        <FormField label="Annual salary ($)" name="annualSalary" type="number" step="0.01" defaultValue={employee?.annualSalary ?? undefined} hint="If salaried" />
        <FormField label="Ordinary hrs / week" name="ordinaryHoursPerWeek" type="number" step="0.5" defaultValue={employee?.ordinaryHoursPerWeek ?? 38} />
        <FormField label="Overtime hrs / week" name="overtimeHoursPerWeek" type="number" step="0.5" defaultValue={employee?.overtimeHoursPerWeek ?? 0} />
        <FormField label="Overtime multiplier" name="overtimeMultiplier" type="number" step="0.05" defaultValue={employee?.overtimeMultiplier ?? 1.5} />
        <FormField label="Weekly allowances ($)" name="weeklyAllowances" type="number" step="0.01" defaultValue={employee?.weeklyAllowances ?? 0} />
        <FormField label="Super rate (%)" name="superRatePercent" type="number" step="0.1" defaultValue={employee?.superRatePercent ?? 11.5} />
        <FormField label="Other on-cost (%)" name="onCostPercent" type="number" step="0.1" defaultValue={employee?.onCostPercent ?? 15} hint="WorkCover, leave loading, etc." />
        <FormField label="Expected billable hrs / week" name="expectedBillableHoursPerWeek" type="number" step="0.5" defaultValue={employee?.expectedBillableHoursPerWeek ?? 32} />
        <FormField label="Charge-out rate ($/hr)" name="chargeOutRate" type="number" step="0.01" defaultValue={employee?.chargeOutRate ?? 0} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="active" defaultChecked={employee?.active ?? true} className="rounded border-slate-300" />
        Active
      </label>

      <FormActions>
        <Button>Save employee</Button>
        <Link href="/employees" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
