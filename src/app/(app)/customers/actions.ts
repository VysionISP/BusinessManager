"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function customerData(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    customerType: str(formData, "customerType") ?? "RESIDENTIAL",
    active: formData.get("active") === "on",
    mainContactName: str(formData, "mainContactName"),
    mainContactPhone: str(formData, "mainContactPhone"),
    mainContactEmail: str(formData, "mainContactEmail"),
    billingContactName: str(formData, "billingContactName"),
    billingContactPhone: str(formData, "billingContactPhone"),
    billingContactEmail: str(formData, "billingContactEmail"),
    billingAddress: str(formData, "billingAddress"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    accountNumber: str(formData, "accountNumber"),
    source: str(formData, "source"),
    notes: str(formData, "notes"),
    paymentTermsDays: Number(formData.get("paymentTermsDays") ?? 14) || 14,
  };
}

export async function createCustomer(formData: FormData) {
  const customer = await prisma.customer.create({ data: customerData(formData) });
  revalidatePath("/customers");
  redirect(`/customers/${customer.id}`);
}

export async function updateCustomer(id: number, formData: FormData) {
  await prisma.customer.update({ where: { id }, data: customerData(formData) });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  redirect(`/customers/${id}`);
}

export async function deleteCustomer(id: number) {
  await prisma.customer.delete({ where: { id } });
  revalidatePath("/customers");
  redirect("/customers");
}

function siteData(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    address: str(formData, "address") ?? "",
    contactName: str(formData, "contactName"),
    contactPhone: str(formData, "contactPhone"),
    accessInstructions: str(formData, "accessInstructions"),
    hoursNotes: str(formData, "hoursNotes"),
    hazardsNotes: str(formData, "hazardsNotes"),
  };
}

export async function createSite(customerId: number, formData: FormData) {
  await prisma.site.create({ data: { customerId, ...siteData(formData) } });
  revalidatePath(`/customers/${customerId}`);
}

export async function updateSite(customerId: number, siteId: number, formData: FormData) {
  await prisma.site.update({ where: { id: siteId }, data: siteData(formData) });
  revalidatePath(`/customers/${customerId}`);
}

export async function deleteSite(customerId: number, siteId: number) {
  await prisma.site.delete({ where: { id: siteId } });
  revalidatePath(`/customers/${customerId}`);
}
