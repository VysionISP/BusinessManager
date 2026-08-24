"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { timesheetWeekRollup } from "@/lib/calculations";
import { addDays } from "@/lib/dates";

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

/**
 * Fill the payroll week from that week's timesheet entries — hours are
 * entered once on the Timesheets screen and rolled up here, instead of
 * being re-keyed. Allowances keep their existing value (or the employee's
 * standard weekly allowance for a fresh week) since timesheets don't
 * capture dollars.
 */
export async function fillPayrollFromTimesheets(weekCommencing: string) {
  const week = new Date(weekCommencing);
  const weekEnd = addDays(week, 7);

  const [employees, entries] = await Promise.all([
    prisma.employee.findMany({ where: { active: true } }),
    prisma.timesheetEntry.findMany({ where: { date: { gte: week, lt: weekEnd } } }),
  ]);

  for (const employee of employees) {
    const own = entries.filter((e) => e.employeeId === employee.id);
    if (own.length === 0) continue;
    const rollup = timesheetWeekRollup(own);
    const existing = await prisma.payrollEntry.findUnique({
      where: { employeeId_weekCommencing: { employeeId: employee.id, weekCommencing: week } },
    });
    const data = {
      ordinaryHours: rollup.ordinaryHours,
      overtimeHours: rollup.overtimeHours,
      leaveHours: rollup.leaveHours,
      sickHours: rollup.sickHours,
      billableHours: rollup.billableHours,
      nonBillableHours: rollup.nonBillableHours,
      allowances: existing?.allowances ?? employee.weeklyAllowances,
    };
    if (existing) {
      await prisma.payrollEntry.update({ where: { id: existing.id }, data });
    } else {
      await prisma.payrollEntry.create({ data: { employeeId: employee.id, weekCommencing: week, ...data } });
    }
  }

  revalidatePath("/payroll");
  revalidatePath("/reports");
}
