"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export interface CreateJobFromQuoteInput {
  customerName: string;
  description: string;
  quoteAmount: number;
  estimatedHours: number;
  labourCost: number;
  materialCost: number;
  subcontractorCost: number;
  otherDirectCosts: number; // equipment hire + travel + accommodation + other
}

export async function createJobFromQuote(input: CreateJobFromQuoteInput): Promise<number> {
  const year = new Date().getFullYear();
  const count = await prisma.job.count();
  let jobNumber = `J-${year}-${String(count + 1).padStart(3, "0")}`;

  const create = async (num: string) =>
    prisma.job.create({
      data: {
        jobNumber: num,
        customerName: input.customerName || "New customer",
        description: input.description || "Quoted job",
        status: "QUOTED",
        quoteDate: new Date(),
        quoteAmount: input.quoteAmount,
        budgetLabourHours: input.estimatedHours,
        budgetLabourCost: input.labourCost,
        budgetMaterials: input.materialCost,
        budgetSubcontractors: input.subcontractorCost,
        budgetOtherDirectCosts: input.otherDirectCosts,
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

  revalidatePath("/jobs");
  revalidatePath("/");
  return job.id;
}
