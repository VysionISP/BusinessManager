import { Button, FormActions, FormField } from "@/components/FormField";
import { QUOTE_SECTION_DISPLAY_MODES, QUOTE_SECTION_DISPLAY_MODE_LABELS } from "@/lib/types";
import type { QuoteSection } from "@prisma/client";

export function SectionForm({
  section,
  action,
  submitLabel = "Save section",
}: {
  section?: QuoteSection;
  action: (formData: FormData) => void;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="space-y-3">
      <FormField label="Section name" name="name" defaultValue={section?.name} required hint="e.g. Switchboard upgrade" />
      <FormField label="Description" name="description" defaultValue={section?.description ?? undefined} />
      <FormField
        label="Appears on the quote as"
        name="displayMode"
        defaultValue={section?.displayMode ?? "ITEMIZED"}
        options={QUOTE_SECTION_DISPLAY_MODES.map((m) => ({ value: m, label: QUOTE_SECTION_DISPLAY_MODE_LABELS[m] }))}
        hint="Itemized shows every line to the customer; Fixed price shows this section as one lump sum."
      />
      <FormActions>
        <Button variant="secondary">{submitLabel}</Button>
      </FormActions>
    </form>
  );
}
