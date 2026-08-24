import { FormField } from "@/components/FormField";
import type { Site } from "@prisma/client";

export function SiteForm({ site, action, submitLabel = "Add site" }: { site?: Site; action: (formData: FormData) => void; submitLabel?: string }) {
  return (
    <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <FormField label="Site name" name="name" defaultValue={site?.name} required hint="e.g. Gippsland Centre, Sale" />
      <FormField label="Address" name="address" defaultValue={site?.address} required />
      <FormField label="Site contact" name="contactName" defaultValue={site?.contactName ?? undefined} />
      <FormField label="Contact phone" name="contactPhone" defaultValue={site?.contactPhone ?? undefined} />
      <FormField label="Access instructions" name="accessInstructions" defaultValue={site?.accessInstructions ?? undefined} hint="Parking, induction, keys, alarm codes" />
      <FormField label="Hours / access times" name="hoursNotes" defaultValue={site?.hoursNotes ?? undefined} />
      <div className="sm:col-span-2">
        <FormField label="Site hazards" name="hazardsNotes" defaultValue={site?.hazardsNotes ?? undefined} />
      </div>
      <div className="sm:col-span-2">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
