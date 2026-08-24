"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const raw = str(formData, key);
  return raw ? new Date(raw) : null;
}

function jobData(formData: FormData) {
  const siteIdRaw = str(formData, "siteId");
  const projectManagerIdRaw = str(formData, "projectManagerId");
  return {
    jobNumber: str(formData, "jobNumber"),
    customerId: num(formData, "customerId"),
    siteId: siteIdRaw ? Number(siteIdRaw) : null,
    projectManagerId: projectManagerIdRaw ? Number(projectManagerIdRaw) : null,
    customerOrderNumber: str(formData, "customerOrderNumber") || null,
    pricingMethod: str(formData, "pricingMethod") || "FIXED_PRICE",
    description: str(formData, "description"),
    status: str(formData, "status") || "LEAD",
    quoteDate: dateOrNull(formData, "quoteDate"),
    startDate: dateOrNull(formData, "startDate"),
    expectedCompletionDate: dateOrNull(formData, "expectedCompletionDate"),
    quoteAmount: num(formData, "quoteAmount"),
    budgetLabourHours: num(formData, "budgetLabourHours"),
    budgetLabourCost: num(formData, "budgetLabourCost"),
    budgetMaterials: num(formData, "budgetMaterials"),
    budgetSubcontractors: num(formData, "budgetSubcontractors"),
    budgetOtherDirectCosts: num(formData, "budgetOtherDirectCosts"),
    percentComplete: num(formData, "percentComplete"),
    targetMarginPercent: formData.get("targetMarginPercent") ? num(formData, "targetMarginPercent") : null,
    retentionPercent: num(formData, "retentionPercent"),
  };
}

export async function createJob(formData: FormData) {
  const job = await prisma.job.create({ data: jobData(formData) });
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}

export async function updateJob(id: number, formData: FormData) {
  await prisma.job.update({ where: { id }, data: jobData(formData) });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/");
  redirect(`/jobs/${id}`);
}

export async function updateJobProgress(id: number, formData: FormData) {
  await prisma.job.update({
    where: { id },
    data: { status: str(formData, "status"), percentComplete: num(formData, "percentComplete") },
  });
  revalidatePath("/jobs");
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/");
}

export async function deleteJob(id: number) {
  await prisma.job.delete({ where: { id } });
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect("/jobs");
}

export async function addCostEntry(jobId: number, formData: FormData) {
  const phaseIdRaw = str(formData, "phaseId");
  await prisma.jobCostEntry.create({
    data: {
      jobId,
      phaseId: phaseIdRaw ? Number(phaseIdRaw) : null,
      date: dateOrNull(formData, "date") ?? new Date(),
      category: str(formData, "category") || "OTHER",
      description: str(formData, "description"),
      hours: formData.get("hours") ? num(formData, "hours") : null,
      amount: num(formData, "amount"),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function deleteCostEntry(jobId: number, entryId: number) {
  await prisma.jobCostEntry.delete({ where: { id: entryId } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function addInvoice(jobId: number, formData: FormData) {
  await prisma.invoice.create({
    data: {
      jobId,
      invoiceNumber: str(formData, "invoiceNumber"),
      type: str(formData, "type") || "PROGRESS",
      issueDate: dateOrNull(formData, "issueDate") ?? new Date(),
      dueDate: dateOrNull(formData, "dueDate") ?? new Date(),
      amount: num(formData, "amount"),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function deleteInvoice(jobId: number, invoiceId: number) {
  await prisma.invoice.delete({ where: { id: invoiceId } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function addPayment(jobId: number, invoiceId: number, formData: FormData) {
  await prisma.payment.create({
    data: {
      invoiceId,
      date: dateOrNull(formData, "date") ?? new Date(),
      amount: num(formData, "amount"),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function deletePayment(jobId: number, paymentId: number) {
  await prisma.payment.delete({ where: { id: paymentId } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function addPhase(jobId: number, formData: FormData) {
  const existingCount = await prisma.jobPhase.count({ where: { jobId } });
  await prisma.jobPhase.create({
    data: {
      jobId,
      name: str(formData, "name"),
      description: str(formData, "description") || null,
      sortOrder: existingCount,
      status: str(formData, "status") || "PENDING",
      scheduledStart: dateOrNull(formData, "scheduledStart"),
      scheduledEnd: dateOrNull(formData, "scheduledEnd"),
      budgetLabourHours: num(formData, "budgetLabourHours"),
      budgetLabourCost: num(formData, "budgetLabourCost"),
      budgetMaterials: num(formData, "budgetMaterials"),
      budgetSubcontractors: num(formData, "budgetSubcontractors"),
      budgetOtherDirectCosts: num(formData, "budgetOtherDirectCosts"),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function updatePhase(jobId: number, phaseId: number, formData: FormData) {
  await prisma.jobPhase.update({
    where: { id: phaseId },
    data: {
      name: str(formData, "name"),
      description: str(formData, "description") || null,
      status: str(formData, "status") || "PENDING",
      scheduledStart: dateOrNull(formData, "scheduledStart"),
      scheduledEnd: dateOrNull(formData, "scheduledEnd"),
      budgetLabourHours: num(formData, "budgetLabourHours"),
      budgetLabourCost: num(formData, "budgetLabourCost"),
      budgetMaterials: num(formData, "budgetMaterials"),
      budgetSubcontractors: num(formData, "budgetSubcontractors"),
      budgetOtherDirectCosts: num(formData, "budgetOtherDirectCosts"),
      percentComplete: num(formData, "percentComplete"),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
}

export async function deletePhase(jobId: number, phaseId: number) {
  await prisma.jobPhase.delete({ where: { id: phaseId } });
  revalidatePath(`/jobs/${jobId}`);
}

function variationData(formData: FormData) {
  return {
    title: str(formData, "title"),
    scope: str(formData, "scope"),
    reason: str(formData, "reason") || null,
    requestedBy: str(formData, "requestedBy") || null,
    requestDate: dateOrNull(formData, "requestDate"),
    labourAllowance: num(formData, "labourAllowance"),
    materialAllowance: num(formData, "materialAllowance"),
    subcontractorAllowance: num(formData, "subcontractorAllowance"),
    otherAllowance: num(formData, "otherAllowance"),
    markupPercent: num(formData, "markupPercent", 20),
    sellPriceOverride: formData.get("sellPriceOverride") ? num(formData, "sellPriceOverride") : null,
  };
}

export async function addVariation(jobId: number, formData: FormData) {
  const existingCount = await prisma.variation.count({ where: { jobId } });
  await prisma.variation.create({
    data: {
      jobId,
      variationNumber: `V-${existingCount + 1}`,
      status: "PENDING",
      customerApproved: false,
      ...variationData(formData),
    },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function setVariationStatus(jobId: number, variationId: number, formData: FormData) {
  const status = str(formData, "status") || "PENDING";
  await prisma.variation.update({
    where: { id: variationId },
    data: {
      status,
      customerApproved: status === "APPROVED",
      approvedDate: status === "APPROVED" ? new Date() : null,
    },
  });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function deleteVariation(jobId: number, variationId: number) {
  await prisma.variation.delete({ where: { id: variationId } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}

export async function createChargeUpInvoice(jobId: number, formData: FormData) {
  const entryIds = formData.getAll("costEntryIds").map((v) => Number(v));
  if (entryIds.length === 0) return;

  const entries = await prisma.jobCostEntry.findMany({ where: { id: { in: entryIds }, jobId } });
  const costTotal = entries.reduce((sum, e) => sum + e.amount, 0);
  const markupPercent = num(formData, "markupPercent");
  const amount = costTotal * (1 + markupPercent / 100);

  const invoice = await prisma.invoice.create({
    data: {
      jobId,
      invoiceNumber: str(formData, "invoiceNumber") || `CU-${Date.now().toString().slice(-6)}`,
      type: "PROGRESS",
      issueDate: dateOrNull(formData, "issueDate") ?? new Date(),
      dueDate: dateOrNull(formData, "dueDate") ?? new Date(),
      amount,
    },
  });

  await prisma.jobCostEntry.updateMany({ where: { id: { in: entryIds } }, data: { invoiceId: invoice.id } });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/");
}
