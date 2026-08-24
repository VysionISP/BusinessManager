"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { FORM_FIELD_TYPES, type FormFieldDef } from "@/lib/types";

const MAX_FIELDS = 12;

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function parseFields(formData: FormData): FormFieldDef[] {
  const fields: FormFieldDef[] = [];
  for (let i = 0; i < MAX_FIELDS; i++) {
    const label = str(formData, `field_${i}_label`);
    if (!label) continue;
    const typeRaw = str(formData, `field_${i}_type`) ?? "TEXT";
    const type = (FORM_FIELD_TYPES as readonly string[]).includes(typeRaw) ? (typeRaw as FormFieldDef["type"]) : "TEXT";
    const optionsRaw = str(formData, `field_${i}_options`);
    fields.push({
      id: `f${i}`,
      label,
      type,
      required: formData.get(`field_${i}_required`) === "on",
      options: optionsRaw ? optionsRaw.split(",").map((o) => o.trim()).filter(Boolean) : undefined,
    });
  }
  return fields;
}

export async function createFormTemplate(formData: FormData) {
  const fields = parseFields(formData);
  const template = await prisma.formTemplate.create({
    data: {
      name: str(formData, "name") ?? "Untitled form",
      description: str(formData, "description"),
      isCertificate: formData.get("isCertificate") === "on",
      fieldsJson: JSON.stringify(fields),
    },
  });
  revalidatePath("/forms");
  redirect(`/forms`);
  return template;
}

export async function updateFormTemplate(id: number, formData: FormData) {
  const fields = parseFields(formData);
  await prisma.formTemplate.update({
    where: { id },
    data: {
      name: str(formData, "name") ?? "Untitled form",
      description: str(formData, "description"),
      isCertificate: formData.get("isCertificate") === "on",
      active: formData.get("active") === "on",
      fieldsJson: JSON.stringify(fields),
    },
  });
  revalidatePath("/forms");
  redirect(`/forms`);
}

export async function deleteFormTemplate(id: number) {
  await prisma.formTemplate.delete({ where: { id } });
  revalidatePath("/forms");
}

export async function submitForm(templateId: number, jobId: number | null, formData: FormData) {
  const template = await prisma.formTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Form template not found");

  const fields: FormFieldDef[] = JSON.parse(template.fieldsJson);
  const answers: Record<string, string> = {};
  for (const field of fields) {
    const value = formData.get(field.id);
    if (value !== null) answers[field.id] = String(value);
  }

  await prisma.formSubmission.create({
    data: {
      formTemplateId: templateId,
      jobId,
      phaseId: str(formData, "phaseId") ? Number(str(formData, "phaseId")) : null,
      submittedBy: str(formData, "submittedBy"),
      answersJson: JSON.stringify(answers),
      status: "SUBMITTED",
    },
  });

  revalidatePath("/forms");
  if (jobId) {
    revalidatePath(`/jobs/${jobId}`);
    redirect(`/jobs/${jobId}`);
  }
  redirect("/forms");
}

export async function deleteFormSubmission(id: number, jobId: number | null) {
  await prisma.formSubmission.delete({ where: { id } });
  revalidatePath("/forms");
  if (jobId) revalidatePath(`/jobs/${jobId}`);
}
