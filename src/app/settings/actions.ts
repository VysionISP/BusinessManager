"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/queries";

export async function updateSettings(formData: FormData) {
  const settings = await getSettings();
  await prisma.settings.update({
    where: { id: settings.id },
    data: {
      businessName: String(formData.get("businessName") ?? settings.businessName),
      targetMarginPercent: Number(formData.get("targetMarginPercent") ?? settings.targetMarginPercent),
      targetUtilisationPercent: Number(formData.get("targetUtilisationPercent") ?? settings.targetUtilisationPercent),
      openingBankBalance: Number(formData.get("openingBankBalance") ?? settings.openingBankBalance),
    },
  });
  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/break-even");
  revalidatePath("/cashflow");
  revalidatePath("/quotes");
}
