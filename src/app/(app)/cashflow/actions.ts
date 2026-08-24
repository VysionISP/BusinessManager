"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function addCashflowAdjustment(formData: FormData) {
  await prisma.cashflowAdjustment.create({
    data: {
      weekStarting: new Date(String(formData.get("weekStarting"))),
      direction: String(formData.get("direction") ?? "OUT"),
      category: String(formData.get("category") ?? "").trim() || "Other",
      description: String(formData.get("description") ?? "").trim(),
      amount: Number(formData.get("amount") ?? 0) || 0,
    },
  });
  revalidatePath("/cashflow");
  revalidatePath("/");
}

export async function deleteCashflowAdjustment(id: number) {
  await prisma.cashflowAdjustment.delete({ where: { id } });
  revalidatePath("/cashflow");
  revalidatePath("/");
}
