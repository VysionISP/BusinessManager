"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

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
    data: { quoteNumber, version: 1, status: "DRAFT", ...quoteHeaderData(formData) },
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
  await prisma.quote.update({ where: { id }, data });
  revalidatePath(`/quotes/${id}`);
  revalidatePath("/quotes");
}

export async function createNewVersion(id: number) {
  const original = await prisma.quote.findUnique({ where: { id }, include: { lines: true } });
  if (!original) throw new Error("Quote not found");

  const newVersion = await prisma.quote.create({
    data: {
      quoteNumber: original.quoteNumber,
      version: original.version + 1,
      customerId: original.customerId,
      siteId: original.siteId,
      title: original.title,
      customerReference: original.customerReference,
      introduction: original.introduction,
      scopeOfWork: original.scopeOfWork,
      exclusions: original.exclusions,
      termsAndConditions: original.termsAndConditions,
      status: "DRAFT",
      lines: {
        create: original.lines.map((l) => ({
          section: l.section,
          description: l.description,
          quantity: l.quantity,
          unit: l.unit,
          unitCost: l.unitCost,
          unitPrice: l.unitPrice,
          sortOrder: l.sortOrder,
        })),
      },
    },
  });

  revalidatePath("/quotes");
  redirect(`/quotes/${newVersion.id}`);
}

export async function addQuoteLine(quoteId: number, formData: FormData) {
  const existingCount = await prisma.quoteLine.count({ where: { quoteId } });
  await prisma.quoteLine.create({
    data: {
      quoteId,
      section: str(formData, "section"),
      description: str(formData, "description") ?? "",
      quantity: num(formData, "quantity", 1),
      unit: str(formData, "unit") ?? "item",
      unitCost: num(formData, "unitCost"),
      unitPrice: num(formData, "unitPrice"),
      sortOrder: existingCount,
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function deleteQuoteLine(quoteId: number, lineId: number) {
  await prisma.quoteLine.delete({ where: { id: lineId } });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function convertQuoteToJob(id: number) {
  const quote = await prisma.quote.findUnique({ where: { id }, include: { lines: true } });
  if (!quote) throw new Error("Quote not found");

  const totalPrice = quote.lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
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

  revalidatePath(`/quotes/${id}`);
  revalidatePath("/jobs");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}
