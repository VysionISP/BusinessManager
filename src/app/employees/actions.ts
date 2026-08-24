"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function employeeData(formData: FormData) {
  return {
    name: str(formData, "name"),
    role: str(formData, "role"),
    employeeType: str(formData, "employeeType") || "EMPLOYEE",
    payType: str(formData, "payType") || "HOURLY",
    baseHourlyRate: num(formData, "baseHourlyRate"),
    annualSalary: formData.get("annualSalary") ? num(formData, "annualSalary") : null,
    ordinaryHoursPerWeek: num(formData, "ordinaryHoursPerWeek", 38),
    overtimeHoursPerWeek: num(formData, "overtimeHoursPerWeek"),
    overtimeMultiplier: num(formData, "overtimeMultiplier", 1.5),
    weeklyAllowances: num(formData, "weeklyAllowances"),
    superRatePercent: num(formData, "superRatePercent", 11.5),
    onCostPercent: num(formData, "onCostPercent", 15),
    expectedBillableHoursPerWeek: num(formData, "expectedBillableHoursPerWeek", 32),
    chargeOutRate: num(formData, "chargeOutRate"),
    active: formData.get("active") === "on",
  };
}

export async function createEmployee(formData: FormData) {
  await prisma.employee.create({ data: employeeData(formData) });
  revalidatePath("/employees");
  revalidatePath("/");
  redirect("/employees");
}

export async function updateEmployee(id: number, formData: FormData) {
  await prisma.employee.update({ where: { id }, data: employeeData(formData) });
  revalidatePath("/employees");
  revalidatePath("/");
  redirect("/employees");
}

export async function deleteEmployee(id: number) {
  await prisma.employee.delete({ where: { id } });
  revalidatePath("/employees");
  revalidatePath("/");
}

export async function toggleEmployeeActive(id: number, active: boolean) {
  await prisma.employee.update({ where: { id }, data: { active } });
  revalidatePath("/employees");
  revalidatePath("/");
}
