"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS, ENQUIRY_URGENCIES } from "@/lib/types";
import { toDateInputValue } from "@/lib/format";
import type { Enquiry } from "@prisma/client";

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
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

export function EnquiryForm({
  enquiry,
  customers,
  sites,
  action,
}: {
  enquiry?: Enquiry;
  customers: CustomerOption[];
  sites: SiteOption[];
  action: (formData: FormData) => void;
}) {
  const [customerId, setCustomerId] = useState<number | "">(enquiry?.customerId ?? "");
  const filteredSites = sites.filter((s) => s.customerId === customerId);

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700 dark:text-slate-300">Existing customer (optional)</span>
          <select
            name="customerId"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : "")}
            className={selectClasses}
          >
            <option value="">New / prospective customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        {customerId !== "" && (
          <label className="block text-sm">
            <span className="font-medium text-slate-700 dark:text-slate-300">Site</span>
            <select name="siteId" defaultValue={enquiry?.siteId ?? ""} className={selectClasses}>
              <option value="">No specific site</option>
              {filteredSites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <FormField label="Contact name" name="contactName" defaultValue={enquiry?.contactName ?? undefined} />
        <FormField label="Contact phone" name="contactPhone" defaultValue={enquiry?.contactPhone ?? undefined} />
        <FormField label="Contact email" name="contactEmail" type="email" defaultValue={enquiry?.contactEmail ?? undefined} />
        <FormField label="Source" name="source" defaultValue={enquiry?.source ?? undefined} hint="Referral, Google, repeat, signage..." />
      </div>

      <FormField label="Work requested" name="workRequested" defaultValue={enquiry?.workRequested} required />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <FormField
          label="Urgency"
          name="urgency"
          defaultValue={enquiry?.urgency ?? "NORMAL"}
          options={ENQUIRY_URGENCIES.map((u) => ({ value: u, label: u.charAt(0) + u.slice(1).toLowerCase() }))}
        />
        <FormField
          label="Status"
          name="status"
          defaultValue={enquiry?.status ?? "NEW"}
          options={ENQUIRY_STATUSES.map((s) => ({ value: s, label: ENQUIRY_STATUS_LABELS[s] }))}
        />
        <FormField label="Preferred attendance time" name="preferredTime" defaultValue={enquiry?.preferredTime ?? undefined} />
        <FormField label="Estimated value ($)" name="estimatedValue" type="number" step="0.01" defaultValue={enquiry?.estimatedValue ?? undefined} />
        <FormField label="Assigned to" name="assignedTo" defaultValue={enquiry?.assignedTo ?? undefined} />
        <FormField label="Follow-up date" name="followUpDate" type="date" defaultValue={toDateInputValue(enquiry?.followUpDate)} />
      </div>

      <FormField label="Outcome / notes" name="outcomeNotes" defaultValue={enquiry?.outcomeNotes ?? undefined} />

      <FormActions>
        <Button>Save enquiry</Button>
        <Link href="/enquiries" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
