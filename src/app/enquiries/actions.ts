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

function enquiryData(formData: FormData) {
  const customerIdRaw = str(formData, "customerId");
  const siteIdRaw = str(formData, "siteId");
  return {
    customerId: customerIdRaw ? Number(customerIdRaw) : null,
    siteId: siteIdRaw ? Number(siteIdRaw) : null,
    contactName: str(formData, "contactName"),
    contactPhone: str(formData, "contactPhone"),
    contactEmail: str(formData, "contactEmail"),
    source: str(formData, "source"),
    workRequested: str(formData, "workRequested") ?? "",
    urgency: str(formData, "urgency") ?? "NORMAL",
    preferredTime: str(formData, "preferredTime"),
    status: str(formData, "status") ?? "NEW",
    estimatedValue: formData.get("estimatedValue") ? Number(formData.get("estimatedValue")) : null,
    assignedTo: str(formData, "assignedTo"),
    followUpDate: dateOrNull(formData, "followUpDate"),
    outcomeNotes: str(formData, "outcomeNotes"),
  };
}

export async function createEnquiry(formData: FormData) {
  const enquiry = await prisma.enquiry.create({ data: enquiryData(formData) });
  revalidatePath("/enquiries");
  revalidatePath("/");
  redirect(`/enquiries/${enquiry.id}`);
}

export async function updateEnquiry(id: number, formData: FormData) {
  await prisma.enquiry.update({ where: { id }, data: enquiryData(formData) });
  revalidatePath("/enquiries");
  revalidatePath(`/enquiries/${id}`);
  revalidatePath("/");
}

export async function deleteEnquiry(id: number) {
  await prisma.enquiry.delete({ where: { id } });
  revalidatePath("/enquiries");
  revalidatePath("/");
  redirect("/enquiries");
}

export async function convertEnquiryToJob(id: number) {
  const enquiry = await prisma.enquiry.findUnique({ where: { id } });
  if (!enquiry) throw new Error("Enquiry not found");

  let customerId = enquiry.customerId;
  if (!customerId) {
    const customer = await prisma.customer.create({
      data: {
        name: enquiry.contactName || "New customer",
        mainContactName: enquiry.contactName,
        mainContactPhone: enquiry.contactPhone,
        mainContactEmail: enquiry.contactEmail,
        source: enquiry.source,
      },
    });
    customerId = customer.id;
  }

  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  let jobNumber = `J-${year}-${String(count + 1).padStart(3, "0")}`;

  const create = (num: string) =>
    prisma.job.create({
      data: {
        jobNumber: num,
        customerId: customerId!,
        siteId: enquiry.siteId,
        enquiryId: enquiry.id,
        description: enquiry.workRequested,
        status: "LEAD",
        quoteAmount: enquiry.estimatedValue ?? 0,
      },
    });

  let job;
  try {
    job = await create(jobNumber);
  } catch {
    jobNumber = `${jobNumber}-${Date.now().toString().slice(-4)}`;
    job = await create(jobNumber);
  }

  await prisma.enquiry.update({ where: { id }, data: { status: "CONVERTED" } });

  revalidatePath("/enquiries");
  revalidatePath("/jobs");
  revalidatePath("/customers");
  revalidatePath("/");
  redirect(`/jobs/${job.id}`);
}
