"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { QUOTE_LINE_TYPES } from "@/lib/types";

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
  const count = await prisma.quote.count({ where: { version: 1, isTemplate: false } });
  return `Q-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createQuote(formData: FormData) {
  const quoteNumber = await nextQuoteNumber();
  const header = quoteHeaderData(formData);
  const settings = await prisma.settings.findFirst();
  if (!header.introduction && settings?.defaultQuoteIntroduction) header.introduction = settings.defaultQuoteIntroduction;
  if (!header.termsAndConditions && settings?.defaultQuoteTerms) header.termsAndConditions = settings.defaultQuoteTerms;
  const quote = await prisma.quote.create({
    data: {
      quoteNumber,
      version: 1,
      status: "DRAFT",
      ...header,
      sections: { create: [{ name: "Section 1", displayMode: "ITEMIZED", sortOrder: 0 }] },
    },
  });
  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function updateQuote(id: number, formData: FormData) {
  const existing = await prisma.quote.findUnique({ where: { id }, select: { isTemplate: true } });
  const header = quoteHeaderData(formData);
  // Templates have no customer/site — the edit form is reused for their
  // title/terms, but must not attach a customer.
  const data = existing?.isTemplate ? { ...header, customerId: null, siteId: null } : header;
  await prisma.quote.update({ where: { id }, data });
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
      lineType: l.lineType,
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
  const lineTypeRaw = str(formData, "lineType") ?? "MATERIAL";
  return {
    lineType: (QUOTE_LINE_TYPES as readonly string[]).includes(lineTypeRaw) ? lineTypeRaw : "MATERIAL",
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
  const customerId = quote.customerId;
  if (quote.isTemplate || customerId === null) throw new Error("Templates cannot be converted to jobs — create a quote from the template first");

  const totalPrice = quote.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice * (1 - l.discountPercent / 100), 0);

  // Split the budget by line type so the job starts with a real cost
  // breakdown, not one lump sum. Labour hours come from labour-line
  // quantities (the grid quotes labour in hours).
  const costOf = (type: string) =>
    quote.lines.filter((l) => l.lineType === type).reduce((sum, l) => sum + l.quantity * l.unitCost, 0);
  const budgetLabourCost = costOf("LABOUR");
  const budgetLabourHours = quote.lines
    .filter((l) => l.lineType === "LABOUR")
    .reduce((sum, l) => sum + l.quantity, 0);
  const budgetMaterials = costOf("MATERIAL");
  const budgetSubcontractors = costOf("SUBCONTRACT");
  const budgetOtherDirectCosts = costOf("OTHER");

  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  let jobNumber = `J-${year}-${String(count + 1).padStart(3, "0")}`;

  const create = (num: string) =>
    prisma.job.create({
      data: {
        jobNumber: num,
        customerId,
        siteId: quote.siteId,
        description: quote.title,
        status: "QUOTED",
        quoteDate: quote.issueDate ?? new Date(),
        quoteAmount: totalPrice,
        budgetLabourHours,
        budgetLabourCost,
        budgetMaterials,
        budgetSubcontractors,
        budgetOtherDirectCosts,
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

// ---------------------------------------------------------------------------
// Object-based actions for the spreadsheet-style quote builder — the grid
// autosaves as you type, so these take plain data instead of FormData.
// ---------------------------------------------------------------------------

export interface QuoteLineInput {
  lineType: string;
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
}

function cleanLineInput(data: QuoteLineInput) {
  const n = (v: number) => (Number.isFinite(v) ? v : 0);
  return {
    lineType: (QUOTE_LINE_TYPES as readonly string[]).includes(data.lineType) ? data.lineType : "MATERIAL",
    description: String(data.description ?? "").slice(0, 500),
    quantity: n(data.quantity),
    unit: String(data.unit || "item").slice(0, 20),
    unitCost: n(data.unitCost),
    unitPrice: n(data.unitPrice),
    taxPercent: n(data.taxPercent),
    discountPercent: n(data.discountPercent),
  };
}

export async function saveQuoteLineInline(quoteId: number, lineId: number, data: QuoteLineInput) {
  await prisma.quoteLine.update({ where: { id: lineId, quoteId }, data: cleanLineInput(data) });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function createQuoteLineInline(quoteId: number, sectionId: number, data: QuoteLineInput): Promise<{ id: number }> {
  const existingCount = await prisma.quoteLine.count({ where: { sectionId } });
  const line = await prisma.quoteLine.create({
    data: { quoteId, sectionId, sortOrder: existingCount, ...cleanLineInput(data) },
  });
  revalidatePath(`/quotes/${quoteId}`);
  return { id: line.id };
}

export async function updateSectionInline(
  quoteId: number,
  sectionId: number,
  data: { name: string; description: string; displayMode: string },
) {
  await prisma.quoteSection.update({
    where: { id: sectionId, quoteId },
    data: {
      name: String(data.name || "Section").slice(0, 200),
      description: String(data.description ?? "").slice(0, 1000) || null,
      displayMode: data.displayMode === "FIXED" ? "FIXED" : "ITEMIZED",
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

// ---------------------------------------------------------------------------
// Templates & duplication
// ---------------------------------------------------------------------------

async function nextTemplateNumber(): Promise<string> {
  const count = await prisma.quote.count({ where: { isTemplate: true } });
  return `TPL-${String(count + 1).padStart(3, "0")}`;
}

/** Deep-copy a quote's sections + lines onto another quote. */
async function copySectionsAndLines(fromQuoteId: number, toQuoteId: number) {
  const from = await prisma.quote.findUnique({
    where: { id: fromQuoteId },
    include: { sections: { orderBy: { sortOrder: "asc" } }, lines: { orderBy: { sortOrder: "asc" } } },
  });
  if (!from) return;
  const sectionIdMap = new Map<number, number>();
  for (const section of from.sections) {
    const created = await prisma.quoteSection.create({
      data: {
        quoteId: toQuoteId,
        name: section.name,
        description: section.description,
        displayMode: section.displayMode,
        sortOrder: section.sortOrder,
      },
    });
    sectionIdMap.set(section.id, created.id);
  }
  if (from.lines.length > 0) {
    await prisma.quoteLine.createMany({
      data: from.lines.map((l) => ({
        quoteId: toQuoteId,
        sectionId: l.sectionId ? (sectionIdMap.get(l.sectionId) ?? null) : null,
        lineType: l.lineType,
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
  }
}

export async function createBlankTemplate() {
  const template = await prisma.quote.create({
    data: {
      quoteNumber: await nextTemplateNumber(),
      version: 1,
      isTemplate: true,
      status: "DRAFT",
      title: "New template",
      sections: { create: [{ name: "Section 1", displayMode: "ITEMIZED", sortOrder: 0 }] },
    },
  });
  revalidatePath("/quotes");
  redirect(`/quotes/${template.id}`);
}

export async function saveQuoteAsTemplate(id: number) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote) throw new Error("Quote not found");
  const template = await prisma.quote.create({
    data: {
      quoteNumber: await nextTemplateNumber(),
      version: 1,
      isTemplate: true,
      status: "DRAFT",
      title: quote.title,
      introduction: quote.introduction,
      scopeOfWork: quote.scopeOfWork,
      exclusions: quote.exclusions,
      termsAndConditions: quote.termsAndConditions,
    },
  });
  await copySectionsAndLines(id, template.id);
  await logAudit("Quote", template.id, "TEMPLATE_CREATED", `Template ${template.quoteNumber} saved from ${quote.quoteNumber}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${template.id}`);
}

export async function createQuoteFromTemplate(templateId: number, formData: FormData) {
  const template = await prisma.quote.findUnique({ where: { id: templateId } });
  if (!template || !template.isTemplate) throw new Error("Template not found");
  const customerId = num(formData, "customerId");
  if (!customerId) throw new Error("Pick a customer for the new quote");
  const siteIdRaw = str(formData, "siteId");

  const quote = await prisma.quote.create({
    data: {
      quoteNumber: await nextQuoteNumber(),
      version: 1,
      status: "DRAFT",
      customerId,
      siteId: siteIdRaw ? Number(siteIdRaw) : null,
      title: str(formData, "title") ?? template.title,
      introduction: template.introduction,
      scopeOfWork: template.scopeOfWork,
      exclusions: template.exclusions,
      termsAndConditions: template.termsAndConditions,
    },
  });
  await copySectionsAndLines(templateId, quote.id);
  await logAudit("Quote", quote.id, "QUOTE_CREATED", `${quote.quoteNumber} created from template ${template.quoteNumber}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${quote.id}`);
}

export async function duplicateQuote(id: number) {
  const quote = await prisma.quote.findUnique({ where: { id } });
  if (!quote || quote.isTemplate) throw new Error("Quote not found");
  const copy = await prisma.quote.create({
    data: {
      quoteNumber: await nextQuoteNumber(),
      version: 1,
      status: "DRAFT",
      customerId: quote.customerId,
      siteId: quote.siteId,
      title: `${quote.title} (copy)`,
      customerReference: quote.customerReference,
      introduction: quote.introduction,
      scopeOfWork: quote.scopeOfWork,
      exclusions: quote.exclusions,
      termsAndConditions: quote.termsAndConditions,
    },
  });
  await copySectionsAndLines(id, copy.id);
  await logAudit("Quote", copy.id, "QUOTE_CREATED", `${copy.quoteNumber} duplicated from ${quote.quoteNumber}`);
  revalidatePath("/quotes");
  redirect(`/quotes/${copy.id}`);
}
