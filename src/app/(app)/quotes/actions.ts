"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function quoteHeaderData(formData: FormData) {
  const siteIdRaw = str(formData, "siteId");
  return {
    customerId: num(formData, "customerId"),
    siteId: siteIdRaw ? Number(siteIdRaw) : null,
    title: str(formData, "title") ?? "",
    customerReference: str(formData, "customerReference"),
    introduction: str(formData, "introduction"),
    scopeOfWork: str(formData, "scopeOfWork"),
    exclusions: str(formData, "exclusions"),
    termsAndConditions: str(formData, "termsAndConditions"),
    issueDate: dateOrNull(formData, "issueDate"),
    expiryDate: dateOrNull(formData, "expiryDate"),
  };
}

async function nextQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.quote.count({ where: { version: 1 } });
  return `Q-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createQuote(formData: FormData) {
  const quoteNumber = await nextQuoteNumber();
  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      version: 1,
      status: "DRAFT",
      ...quoteHeaderData(formData),
      sections: { create: [{ name: "Section 1", displayMode: "ITEMIZED", sortOrder: 0 }] },
    },
  });
  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(id: number, formData: FormData) {
  await prisma.quote.update({ where: { id }, data: quoteHeaderData(formData) });
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
  redirect(`/quotes/${id}`);
}

export async function deleteQuote(id: number) {
  await prisma.quote.delete({ where: { id } });
  revalidatePath("/quotes");
  redirect("/quotes");
}

export async function setQuoteStatus(id: number, formData: FormData) {
  const status = str(formData, "status") ?? "DRAFT";
  const data: { status: string; acceptedByName?: string | null; acceptedDate?: Date | null } = { status };
  if (status === "ACCEPTED") {
    data.acceptedByName = str(formData, "acceptedByName");
    data.acceptedDate = new Date();
  }
  const quote = await prisma.quote.update({ where: { id }, data });
  await logAudit("Quote", id, "STATUS_CHANGE", `${quote.quoteNumber} → ${status}`);
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

export async function acceptThisVersion(id: number) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) return;

  // Only one version of a given quoteNumber can be ACCEPTED at a time —
  // decline any sibling versions currently marked accepted.
  await prisma.$transaction([
    prisma.quote.updateMany({
      where: { quoteNumber: quote.quoteNumber, status: "ACCEPTED", id: { not: id } },
      data: { status: "DECLINED" },
    }),
    prisma.quote.update({ where: { id }, data: { status: "ACCEPTED", acceptedDate: new Date() } }),
  ]);
  await logAudit("Quote", id, "STATUS_CHANGE", `${quote.quoteNumber} v${quote.version} accepted`);
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

export async function createNewVersion(id: number) {
  const original = await prisma.quote.findUnique({ where: { id }, include: { sections: true, lines: true } });
  if (!original) throw new Error("Quote not found");

  const latest = await prisma.quote.findFirst({ where: { quoteNumber: original.quoteNumber }, orderBy: { version: "desc" } });
  const nextVersionNumber = (latest?.version ?? original.version) + 1;

  const newVersion = await prisma.quote.create({
    data: {
      quoteNumber: original.quoteNumber,
      version: nextVersionNumber,
      customerId: original.customerId,
      siteId: original.siteId,
      title: original.title,
      customerReference: original.customerReference,
      introduction: original.introduction,
      scopeOfWork: original.scopeOfWork,
      exclusions: original.exclusions,
      termsAndConditions: original.termsAndConditions,
      status: "DRAFT",
    },
  });

  const sectionIdMap = new Map<number, number>();
  for (const section of original.sections) {
    const created = await prisma.quoteSection.create({
      data: {
        quoteId: newVersion.id,
        name: section.name,
        description: section.description,
        displayMode: section.displayMode,
        sortOrder: section.sortOrder,
      },
    });
    sectionIdMap.set(section.id, created.id);
  }

  await prisma.quoteLine.createMany({
    data: original.lines.map((l) => ({
      quoteId: newVersion.id,
      sectionId: l.sectionId ? (sectionIdMap.get(l.sectionId) ?? null) : null,
      description: l.description,
      quantity: l.quantity,
      unit: l.unit,
      unitCost: l.unitCost,
      unitPrice: l.unitPrice,
      taxPercent: l.taxPercent,
      discountPercent: l.discountPercent,
      sortOrder: l.sortOrder,
    })),
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${newVersion.id}`);
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

export async function addSection(quoteId: number, formData: FormData) {
  const existingCount = await prisma.quoteSection.count({ where: { quoteId } });
  await prisma.quoteSection.create({
    data: {
      quoteId,
      name: str(formData, "name") ?? `Section ${existingCount + 1}`,
      description: str(formData, "description"),
      displayMode: str(formData, "displayMode") ?? "ITEMIZED",
      sortOrder: existingCount,
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateSection(quoteId: number, sectionId: number, formData: FormData) {
  await prisma.quoteSection.update({
    where: { id: sectionId },
    data: {
      name: str(formData, "name") ?? "Section",
      description: str(formData, "description"),
      displayMode: str(formData, "displayMode") ?? "ITEMIZED",
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteSection(quoteId: number, sectionId: number) {
  await prisma.quoteSection.delete({ where: { id: sectionId } });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function moveSection(quoteId: number, sectionId: number, direction: "up" | "down") {
  const sections = await prisma.quoteSection.findMany({ where: { quoteId }, orderBy: { sortOrder: "asc" } });
  const index = sections.findIndex((s) => s.id === sectionId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= sections.length) return;

  const a = sections[index];
  const b = sections[swapWith];
  await prisma.$transaction([
    prisma.quoteSection.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.quoteSection.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function reorderSections(quoteId: number, orderedIds: number[]) {
  await prisma.$transaction(orderedIds.map((id, index) => prisma.quoteSection.update({ where: { id }, data: { sortOrder: index } })));
  revalidatePath(`/quotes/${quoteId}`);
}

// ---------------------------------------------------------------------------
// Lines
// ---------------------------------------------------------------------------

function lineData(formData: FormData) {
  return {
    description: str(formData, "description") ?? "",
    quantity: num(formData, "quantity", 1),
    unit: str(formData, "unit") ?? "item",
    unitCost: num(formData, "unitCost"),
    unitPrice: num(formData, "unitPrice"),
    taxPercent: num(formData, "taxPercent"),
    discountPercent: num(formData, "discountPercent"),
  };
}

export async function addQuoteLine(quoteId: number, sectionId: number, formData: FormData) {
  const existingCount = await prisma.quoteLine.count({ where: { sectionId } });
  await prisma.quoteLine.create({
    data: { quoteId, sectionId, sortOrder: existingCount, ...lineData(formData) },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteLine(quoteId: number, lineId: number, formData: FormData) {
  await prisma.quoteLine.update({ where: { id: lineId }, data: lineData(formData) });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteQuoteLine(quoteId: number, lineId: number) {
  await prisma.quoteLine.delete({ where: { id: lineId } });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function moveQuoteLine(quoteId: number, sectionId: number, lineId: number, direction: "up" | "down") {
  const lines = await prisma.quoteLine.findMany({ where: { sectionId }, orderBy: { sortOrder: "asc" } });
  const index = lines.findIndex((l) => l.id === lineId);
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || swapWith < 0 || swapWith >= lines.length) return;

  const a = lines[index];
  const b = lines[swapWith];
  await prisma.$transaction([
    prisma.quoteLine.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.quoteLine.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(`/quotes/${quoteId}`);
}

export async function convertQuoteToJob(id: number) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: true } });
  if (!quote) throw new Error("Quote not found");

  const totalPrice = quote.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);
  const totalCost = quote.lines.reduce((sum, l) => sum + l.quantity * l.unitCost, 0);

  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  let jobNumber = `J-${year}-${String(count + 1).padStart(3, "0")}`;

  const create = (num: string) =>
    prisma.job.create({
      data: {
        jobNumber: num,
        customerId: quote.customerId,
        siteId: quote.siteId,
        description: quote.title,
        status: "QUOTED",
        quoteDate: quote.issueDate ?? new Date(),
        quoteAmount: totalPrice,
        budgetLabourCost: totalCost, // best available split — itemise further on the job once won
        percentComplete: 0,
      },
    });

  let job;
  try {
    job = await create(jobNumber);
  } catch {
    jobNumber = `${jobNumber}-${Date.now().toString().slice(-4)}`;
    job = await create(jobNumber);
  }

  await prisma.quote.update({ where: { id }, data: { jobId: job.id } });
  await logAudit("Job", job.id, "JOB_CREATED", `Created from accepted quote ${quote.quoteNumber}`);

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}
