"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

function assetData(formData: FormData) {
  const siteIdRaw = str(formData, "siteId");
  return {
    siteId: siteIdRaw ? Number(siteIdRaw) : null,
    assetNumber: str(formData, "assetNumber"),
    type: str(formData, "type") ?? "Other",
    manufacturer: str(formData, "manufacturer"),
    model: str(formData, "model"),
    serialNumber: str(formData, "serialNumber"),
    installedDate: dateOrNull(formData, "installedDate"),
    warrantyExpiry: dateOrNull(formData, "warrantyExpiry"),
    location: str(formData, "location"),
    serviceIntervalMonths: formData.get("serviceIntervalMonths") ? Number(formData.get("serviceIntervalMonths")) : null,
    lastServiceDate: dateOrNull(formData, "lastServiceDate"),
    nextServiceDate: dateOrNull(formData, "nextServiceDate"),
    notes: str(formData, "notes"),
  };
}

export async function createAsset(customerId: number, formData: FormData) {
  await prisma.asset.create({ data: { customerId, ...assetData(formData) } });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/assets");
}

export async function updateAsset(customerId: number, assetId: number, formData: FormData) {
  await prisma.asset.update({ where: { id: assetId }, data: assetData(formData) });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/assets");
}

export async function deleteAsset(customerId: number, assetId: number) {
  await prisma.asset.delete({ where: { id: assetId } });
  revalidatePath(`/customers/${customerId}`);
  revalidatePath("/assets");
}

function recurringTemplateData(formData: FormData) {
  const siteIdRaw = str(formData, "siteId");
  return {
    siteId: siteIdRaw ? Number(siteIdRaw) : null,
    name: str(formData, "name") ?? "",
    frequencyMonths: Number(formData.get("frequencyMonths") ?? 12) || 12,
    nextDueDate: dateOrNull(formData, "nextDueDate") ?? new Date(),
    jobDescriptionTemplate: str(formData, "jobDescriptionTemplate") ?? "",
    pricingMethod: str(formData, "pricingMethod") ?? "FIXED_PRICE",
    defaultQuoteAmount: Number(formData.get("defaultQuoteAmount") ?? 0) || 0,
    active: formData.get("active") !== "off",
  };
}

export async function createRecurringTemplate(formData: FormData) {
  const customerId = Number(formData.get("customerId"));
  await prisma.recurringJobTemplate.create({ data: { customerId, ...recurringTemplateData(formData) } });
  revalidatePath("/assets");
}

export async function updateRecurringTemplate(id: number, formData: FormData) {
  await prisma.recurringJobTemplate.update({ where: { id }, data: recurringTemplateData(formData) });
  revalidatePath("/assets");
}

export async function deleteRecurringTemplate(id: number) {
  await prisma.recurringJobTemplate.delete({ where: { id } });
  revalidatePath("/assets");
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export async function generateJobFromTemplate(templateId: number) {
  const template = await prisma.recurringJobTemplate.findUnique({ where: { id: templateId } });
  if (!template) throw new Error("Recurring job template not found");

  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  let jobNumber = `J-${year}-${String(count + 1).padStart(3, "0")}`;

  const create = (num: string) =>
    prisma.job.create({
      data: {
        jobNumber: num,
        customerId: template.customerId,
        siteId: template.siteId,
        description: template.jobDescriptionTemplate,
        status: "APPROVED",
        pricingMethod: template.pricingMethod,
        quoteAmount: template.defaultQuoteAmount,
        percentComplete: 0,
      },
    });

  try {
    await create(jobNumber);
  } catch {
    jobNumber = `${jobNumber}-${Date.now().toString().slice(-4)}`;
    await create(jobNumber);
  }

  await prisma.recurringJobTemplate.update({
    where: { id: templateId },
    data: { nextDueDate: addMonths(template.nextDueDate, template.frequencyMonths) },
  });

  revalidatePath("/assets");
  revalidatePath("/jobs");
  revalidatePath("/");
}
