"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function num(formData: FormData, key: string): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export async function savePayrollWeek(weekCommencing: string, employeeIds: number[], formData: FormData) {
  const week = new Date(weekCommencing);

  for (const employeeId of employeeIds) {
    const data = {
      ordinaryHours: num(formData, `ordinaryHours_${employeeId}`),
      overtimeHours: num(formData, `overtimeHours_${employeeId}`),
      allowances: num(formData, `allowances_${employeeId}`),
      leaveHours: num(formData, `leaveHours_${employeeId}`),
      sickHours: num(formData, `sickHours_${employeeId}`),
      nonBillableHours: num(formData, `nonBillableHours_${employeeId}`),
      billableHours: num(formData, `billableHours_${employeeId}`),
    };

    const existing = await prisma.payrollEntry.findUnique({
      where: { employeeId_weekCommencing: { employeeId, weekCommencing: week } },
    });

    if (existing) {
      await prisma.payrollEntry.update({ where: { id: existing.id }, data });
    } else {
      await prisma.payrollEntry.create({ data: { employeeId, weekCommencing: week, ...data } });
    }
  }

  revalidatePath("/payroll");
  revalidatePath("/reports");
}
