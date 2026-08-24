"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function createExpense(formData: FormData) {
  await prisma.expense.create({
    data: {
      date: new Date(String(formData.get("date"))),
      category: String(formData.get("category") ?? "OTHER"),
      description: String(formData.get("description") ?? "").trim(),
      amount: Number(formData.get("amount") ?? 0) || 0,
    },
  });
  revalidatePath("/expenses");
  revalidatePath("/reports");
}

export async function deleteExpense(id: number) {
  await prisma.expense.delete({ where: { id } });
  revalidatePath("/expenses");
  revalidatePath("/reports");
}
