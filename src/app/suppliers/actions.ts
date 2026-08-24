"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function supplierData(formData: FormData) {
  return {
    name: str(formData, "name") ?? "",
    accountNumber: str(formData, "accountNumber"),
    contactName: str(formData, "contactName"),
    phone: str(formData, "phone"),
    email: str(formData, "email"),
    paymentTermsDays: Number(formData.get("paymentTermsDays") ?? 30) || 30,
    notes: str(formData, "notes"),
    active: formData.get("active") === "on",
  };
}

export async function createSupplier(formData: FormData) {
  await prisma.supplier.create({ data: supplierData(formData) });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplier(id: number, formData: FormData) {
  await prisma.supplier.update({ where: { id }, data: supplierData(formData) });
  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function deleteSupplier(id: number) {
  await prisma.supplier.delete({ where: { id } });
  revalidatePath("/suppliers");
}
