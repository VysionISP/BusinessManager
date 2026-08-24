import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { FORM_FIELD_TYPES, FORM_FIELD_TYPE_LABELS, type FormFieldDef } from "@/lib/types";
import type { FormTemplate } from "@prisma/client";

const MAX_FIELDS = 12;

export function TemplateForm({ template, action }: { template?: FormTemplate; action: (formData: FormData) => void }) {
  const existingFields: FormFieldDef[] = template ? JSON.parse(template.fieldsJson) : [];
  const rows = Array.from({ length: MAX_FIELDS }, (_, i) => existingFields[i]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Form name" name="name" defaultValue={template?.name} required hint="e.g. SWMS, Take 5, RCD Test Sheet" />
        <FormField label="Description" name="description" defaultValue={template?.description ?? undefined} />
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input type="checkbox" name="isCertificate" defaultChecked={template?.isCertificate} className="rounded border-slate-300" />
          This is a certificate (shown separately from regular forms)
        </label>
        {template && (
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input type="checkbox" name="active" defaultChecked={template.active} className="rounded border-slate-300" />
            Active
          </label>
        )}
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Fields</h3>
        <div className="space-y-3">
          {rows.map((field, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-slate-100 p-3 dark:border-slate-800 sm:grid-cols-12 sm:items-end">
              <div className="col-span-2 sm:col-span-4">
                <FormField label={`Field ${i + 1} label`} name={`field_${i}_label`} defaultValue={field?.label} />
              </div>
              <div className="sm:col-span-3">
                <FormField
                  label="Type"
                  name={`field_${i}_type`}
                  defaultValue={field?.type ?? "TEXT"}
                  options={FORM_FIELD_TYPES.map((t) => ({ value: t, label: FORM_FIELD_TYPE_LABELS[t] }))}
                />
              </div>
              <div className="sm:col-span-3">
                <FormField label="Options (comma-separated)" name={`field_${i}_options`} defaultValue={field?.options?.join(", ")} hint="Dropdown / multiple choice only" />
              </div>
              <label className="flex items-center gap-2 pb-2 text-xs text-slate-600 dark:text-slate-300 sm:col-span-2">
                <input type="checkbox" name={`field_${i}_required`} defaultChecked={field?.required} className="rounded border-slate-300" />
                Required
              </label>
            </div>
          ))}
        </div>
      </div>

      <FormActions>
        <Button>Save form</Button>
        <Link href="/forms" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
