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
  return {
    jobNumber: str(formData, "jobNumber"),
    customerName: str(formData, "customerName"),
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
  await prisma.jobCostEntry.create({
    data: {
      jobId,
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
