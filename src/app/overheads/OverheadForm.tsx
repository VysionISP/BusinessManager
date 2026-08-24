import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { EXPENSE_FREQUENCIES, OVERHEAD_CATEGORIES, OVERHEAD_CATEGORY_LABELS } from "@/lib/types";
import type { OverheadExpense } from "@prisma/client";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

export function OverheadForm({ overhead, action }: { overhead?: OverheadExpense; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Category"
          name="category"
          defaultValue={overhead?.category ?? "OTHER"}
          options={OVERHEAD_CATEGORIES.map((c) => ({ value: c, label: OVERHEAD_CATEGORY_LABELS[c] }))}
        />
        <FormField label="Expense name" name="name" defaultValue={overhead?.name} required hint="e.g. Public liability insurance" />
        <FormField label="Amount ($)" name="amount" type="number" step="0.01" defaultValue={overhead?.amount ?? 0} required />
        <FormField
          label="Frequency"
          name="frequency"
          defaultValue={overhead?.frequency ?? "MONTHLY"}
          options={EXPENSE_FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABELS[f] }))}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="active" defaultChecked={overhead?.active ?? true} className="rounded border-slate-300" />
        Active (included in running-cost calculations)
      </label>
      <FormActions>
        <Button>Save expense</Button>
        <Link href="/overheads" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
