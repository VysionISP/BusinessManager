"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { employeeLoadedHourlyRate } from "@/lib/calculations";

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// A timesheet entry posts LABOUR cost to its job only for hours actually
// worked — leave/sick stay in payroll and never hit a job's cost sheet.
function postsToJob(kind: string, jobId: number | null): boolean {
  return jobId !== null && (kind === "ORDINARY" || kind === "OVERTIME");
}

async function costEntryDataFor(entryId: number) {
  const entry = await prisma.timesheetEntry.findUnique({ where: { id: entryId }, include: { employee: true } });
  if (!entry || entry.jobId === null || !postsToJob(entry.kind, entry.jobId)) return null;
  const rate = employeeLoadedHourlyRate(entry.employee, entry.kind);
  return {
    jobId: entry.jobId,
    phaseId: entry.phaseId,
    date: entry.date,
    category: "LABOUR",
    description: `Timesheet — ${entry.employee.name}${entry.kind === "OVERTIME" ? " (overtime)" : ""}`,
    hours: entry.hours,
    amount: entry.hours * rate,
  };
}

/** Create/update/remove the auto-posted LABOUR cost so it mirrors the entry. */
async function syncCostEntry(entryId: number) {
  const entry = await prisma.timesheetEntry.findUnique({ where: { id: entryId }, include: { costEntry: true } });
  if (!entry) return;

  const data = await costEntryDataFor(entryId);

  if (entry.costEntry) {
    // Never touch a cost that's already been pulled onto an invoice.
    if (entry.costEntry.invoiceId !== null) return;
    if (data) {
      await prisma.jobCostEntry.update({ where: { id: entry.costEntry.id }, data });
    } else {
      await prisma.timesheetEntry.update({ where: { id: entryId }, data: { costEntryId: null } });
      await prisma.jobCostEntry.delete({ where: { id: entry.costEntry.id } });
    }
  } else if (data) {
    const cost = await prisma.jobCostEntry.create({ data });
    await prisma.timesheetEntry.update({ where: { id: entryId }, data: { costEntryId: cost.id } });
  }
}

function revalidate(jobId: number | null) {
  revalidatePath("/timesheets");
  revalidatePath("/payroll");
  revalidatePath("/reports");
  revalidatePath("/");
  if (jobId) revalidatePath(`/jobs/${jobId}`);
}

function entryData(formData: FormData) {
  const jobIdRaw = str(formData, "jobId");
  const phaseIdRaw = str(formData, "phaseId");
  const jobId = jobIdRaw ? Number(jobIdRaw) : null;
  return {
    date: new Date(str(formData, "date")),
    hours: num(formData, "hours"),
    kind: str(formData, "kind") || "ORDINARY",
    billable: formData.get("billable") === "on",
    jobId,
    phaseId: jobId && phaseIdRaw ? Number(phaseIdRaw) : null,
    notes: str(formData, "notes") || null,
  };
}

export async function addTimesheetEntry(employeeId: number, formData: FormData) {
  const data = entryData(formData);
  if (!data.hours || Number.isNaN(data.date.getTime())) return;
  const entry = await prisma.timesheetEntry.create({ data: { employeeId, ...data } });
  await syncCostEntry(entry.id);
  revalidate(data.jobId);
}

export async function updateTimesheetEntry(id: number, formData: FormData) {
  const existing = await prisma.timesheetEntry.findUnique({ where: { id }, include: { costEntry: true } });
  if (!existing) return;
  // Locked once its posted cost has been invoiced (charge-up billing).
  if (existing.costEntry?.invoiceId != null) return;
  const data = entryData(formData);
  if (!data.hours || Number.isNaN(data.date.getTime())) return;
  await prisma.timesheetEntry.update({ where: { id }, data });
  await syncCostEntry(id);
  revalidate(existing.jobId ?? data.jobId);
}

export async function deleteTimesheetEntry(id: number) {
  const existing = await prisma.timesheetEntry.findUnique({ where: { id }, include: { costEntry: true } });
  if (!existing) return;
  if (existing.costEntry?.invoiceId != null) return; // already billed — keep the record
  await prisma.timesheetEntry.delete({ where: { id } });
  if (existing.costEntry) await prisma.jobCostEntry.delete({ where: { id: existing.costEntry.id } });
  revalidate(existing.jobId);
}
