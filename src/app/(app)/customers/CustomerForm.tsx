import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { CUSTOMER_TYPES, CUSTOMER_TYPE_LABELS } from "@/lib/types";
import type { Customer } from "@prisma/client";

export function CustomerForm({ customer, action }: { customer?: Customer; action: (formData: FormData) => void }) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Customer / company name" name="name" defaultValue={customer?.name} required />
        <FormField
          label="Customer type"
          name="customerType"
          defaultValue={customer?.customerType ?? "RESIDENTIAL"}
          options={CUSTOMER_TYPES.map((t) => ({ value: t, label: CUSTOMER_TYPE_LABELS[t] }))}
        />
        <FormField label="Account number" name="accountNumber" defaultValue={customer?.accountNumber ?? undefined} />
        <FormField label="Source" name="source" defaultValue={customer?.source ?? undefined} hint="Referral, Google, repeat customer, etc." />
        <FormField label="Payment terms (days)" name="paymentTermsDays" type="number" defaultValue={customer?.paymentTermsDays ?? 14} />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Main contact</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Name" name="mainContactName" defaultValue={customer?.mainContactName ?? undefined} />
          <FormField label="Phone" name="mainContactPhone" defaultValue={customer?.mainContactPhone ?? undefined} />
          <FormField label="Email" name="mainContactEmail" type="email" defaultValue={customer?.mainContactEmail ?? undefined} />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Billing contact (if different)</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Name" name="billingContactName" defaultValue={customer?.billingContactName ?? undefined} />
          <FormField label="Phone" name="billingContactPhone" defaultValue={customer?.billingContactPhone ?? undefined} />
          <FormField label="Email" name="billingContactEmail" type="email" defaultValue={customer?.billingContactEmail ?? undefined} />
        </div>
        <div className="mt-4">
          <FormField label="Billing address" name="billingAddress" defaultValue={customer?.billingAddress ?? undefined} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="General phone" name="phone" defaultValue={customer?.phone ?? undefined} />
        <FormField label="General email" name="email" type="email" defaultValue={customer?.email ?? undefined} />
      </div>

      <FormField label="Internal notes" name="notes" defaultValue={customer?.notes ?? undefined} />

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="active" defaultChecked={customer?.active ?? true} className="rounded border-slate-300" />
        Active
      </label>

      <FormActions>
        <Button>Save customer</Button>
        <Link href="/customers" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
