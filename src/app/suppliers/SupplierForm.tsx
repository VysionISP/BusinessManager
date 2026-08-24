import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import type { Supplier } from "@prisma/client";

export function SupplierForm({ supplier, action }: { supplier?: Supplier; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Supplier name" name="name" defaultValue={supplier?.name} required />
        <FormField label="Account number" name="accountNumber" defaultValue={supplier?.accountNumber ?? undefined} />
        <FormField label="Contact name" name="contactName" defaultValue={supplier?.contactName ?? undefined} />
        <FormField label="Phone" name="phone" defaultValue={supplier?.phone ?? undefined} />
        <FormField label="Email" name="email" type="email" defaultValue={supplier?.email ?? undefined} />
        <FormField label="Payment terms (days)" name="paymentTermsDays" type="number" defaultValue={supplier?.paymentTermsDays ?? 30} />
      </div>
      <FormField label="Notes" name="notes" defaultValue={supplier?.notes ?? undefined} />
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="active" defaultChecked={supplier?.active ?? true} className="rounded border-slate-300" />
        Active
      </label>
      <FormActions>
        <Button>Save supplier</Button>
        <Link href="/suppliers" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
