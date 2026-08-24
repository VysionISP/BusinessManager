"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

export async function createScheduleEvent(formData: FormData) {
  const jobIdRaw = str(formData, "jobId");
  const phaseIdRaw = str(formData, "phaseId");
  const employeeIdRaw = str(formData, "employeeId");
  const siteIdRaw = str(formData, "siteId");
  const startAt = str(formData, "startAt");
  const endAt = str(formData, "endAt");

  await prisma.scheduleEvent.create({
    data: {
      jobId: jobIdRaw ? Number(jobIdRaw) : null,
      phaseId: phaseIdRaw ? Number(phaseIdRaw) : null,
      employeeId: employeeIdRaw ? Number(employeeIdRaw) : null,
      siteId: siteIdRaw ? Number(siteIdRaw) : null,
      eventType: str(formData, "eventType") ?? "WORK",
      title: str(formData, "title") ?? "Job",
      startAt: startAt ? new Date(startAt) : new Date(),
      endAt: endAt ? new Date(endAt) : new Date(),
      notes: str(formData, "notes"),
      status: "SCHEDULED",
    },
  });
  revalidatePath("/scheduling");
}

export async function setScheduleEventStatus(id: number, status: string) {
  await prisma.scheduleEvent.update({ where: { id }, data: { status } });
  revalidatePath("/scheduling");
}

export async function deleteScheduleEvent(id: number) {
  await prisma.scheduleEvent.delete({ where: { id } });
  revalidatePath("/scheduling");
}
