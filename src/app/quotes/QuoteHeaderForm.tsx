"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { toDateInputValue } from "@/lib/format";
import type { Quote } from "@prisma/client";

interface CustomerOption {
  id: number;
  name: string;
}
interface SiteOption {
  id: number;
  name: string;
  customerId: number;
}

const selectClasses =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function QuoteHeaderForm({
  quote,
  customers,
  sites,
  action,
}: {
  quote?: Quote;
  customers: CustomerOption[];
  sites: SiteOption[];
  action: (formData: FormData) => void;
}) {
  const [customerId, setCustomerId] = useState<number>(quote?.customerId ?? customers[0]?.id ?? 0);
  const filteredSites = sites.filter((s) => s.customerId === customerId);

  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Quote title" name="title" defaultValue={quote?.title} required hint="e.g. Main switchboard upgrade" />
        <FormField label="Customer reference" name="customerReference" defaultValue={quote?.customerReference ?? undefined} />

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
          <select name="siteId" defaultValue={quote?.siteId ?? ""} className={selectClasses}>
            <option value="">No specific site</option>
            {filteredSites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <FormField label="Issue date" name="issueDate" type="date" defaultValue={toDateInputValue(quote?.issueDate)} />
        <FormField label="Expiry date" name="expiryDate" type="date" defaultValue={toDateInputValue(quote?.expiryDate)} />
      </div>

      <FormField label="Introduction" name="introduction" defaultValue={quote?.introduction ?? undefined} />
      <FormField label="Scope of work" name="scopeOfWork" defaultValue={quote?.scopeOfWork ?? undefined} />
      <FormField label="Exclusions" name="exclusions" defaultValue={quote?.exclusions ?? undefined} />
      <FormField label="Terms & conditions" name="termsAndConditions" defaultValue={quote?.termsAndConditions ?? undefined} />

      <FormActions>
        <Button>Save quote</Button>
        <Link href="/quotes" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
