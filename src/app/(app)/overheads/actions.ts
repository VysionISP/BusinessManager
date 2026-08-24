"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function overheadData(formData: FormData) {
  return {
    category: String(formData.get("category") ?? "OTHER"),
    name: String(formData.get("name") ?? "").trim(),
    amount: Number(formData.get("amount") ?? 0) || 0,
    frequency: String(formData.get("frequency") ?? "MONTHLY"),
    active: formData.get("active") === "on",
  };
}

export async function createOverhead(formData: FormData) {
  await prisma.overheadExpense.create({ data: overheadData(formData) });
  revalidatePath("/overheads");
  revalidatePath("/");
  redirect("/overheads");
}

export async function updateOverhead(id: number, formData: FormData) {
  await prisma.overheadExpense.update({ where: { id }, data: overheadData(formData) });
  revalidatePath("/overheads");
  revalidatePath("/");
  redirect("/overheads");
}

export async function deleteOverhead(id: number) {
  await prisma.overheadExpense.delete({ where: { id } });
  revalidatePath("/overheads");
  revalidatePath("/");
}
