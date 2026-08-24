import { prisma } from "./db";

/**
 * Lightweight audit trail. Job-related events (status changes, invoices,
 * payments, variations, purchase orders) are all logged under entityType
 * "Job" so a job's detail page can show one unified timeline regardless of
 * which sub-record actually changed — the `action` field says what kind of
 * event it was.
 */
export async function logAudit(entityType: string, entityId: number, action: string, summary: string) {
  await prisma.auditLog.create({ data: { entityType, entityId, action, summary } });
}
