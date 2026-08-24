import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { prisma } from "@/lib/db";
import type { FormFieldDef } from "@/lib/types";
import { submitForm } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SubmitFormPage({
  params,
  searchParams,
}: {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ jobId?: string }>;
}) {
  const { templateId } = await params;
  const { jobId } = await searchParams;
  const template = await prisma.formTemplate.findUnique({ where: { id: Number(templateId) } });
  if (!template) notFound();

  const job = jobId ? await prisma.job.findUnique({ where: { id: Number(jobId) }, include: { phases: true } }) : null;
  const fields: FormFieldDef[] = JSON.parse(template.fieldsJson);

  const boundSubmit = submitForm.bind(null, template.id, job?.id ?? null);

  return (
    <div>
      <PageHeader title={template.name} description={job ? `For ${job.jobNumber}` : template.description ?? undefined} />
      <Card>
        <form action={boundSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Completed by" name="submittedBy" required />
            {job && job.phases.length > 0 && (
              <FormField label="Phase (optional)" name="phaseId" defaultValue="" options={[{ value: "", label: "Whole job" }, ...job.phases.map((p) => ({ value: String(p.id), label: p.name }))]} />
            )}
          </div>

          {fields.map((field) => (
            <FieldInput key={field.id} field={field} />
          ))}

          {fields.length === 0 && <p className="text-sm text-slate-400">This form has no fields yet.</p>}

          <button type="submit" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            Submit
          </button>
        </form>
      </Card>
    </div>
  );
}

function FieldInput({ field }: { field: FormFieldDef }) {
  const label = `${field.label}${field.required ? " *" : ""}`;

  if (field.type === "YES_NO") {
    return (
      <FormField
        label={label}
        name={field.id}
        defaultValue=""
        required={field.required}
        options={[
          { value: "", label: "Select..." },
          { value: "YES", label: "Yes" },
          { value: "NO", label: "No" },
        ]}
      />
    );
  }
  if (field.type === "DROPDOWN" || field.type === "MULTIPLE_CHOICE") {
    return (
      <FormField
        label={label}
        name={field.id}
        defaultValue=""
        required={field.required}
        options={[{ value: "", label: "Select..." }, ...(field.options ?? []).map((o) => ({ value: o, label: o }))]}
      />
    );
  }
  if (field.type === "NUMBER") return <FormField label={label} name={field.id} type="number" required={field.required} />;
  if (field.type === "DATE") return <FormField label={label} name={field.id} type="date" required={field.required} />;
  if (field.type === "SIGNATURE") return <FormField label={`${label} (type full name to sign)`} name={field.id} required={field.required} />;
  return <FormField label={label} name={field.id} required={field.required} />;
}
