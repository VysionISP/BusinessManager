"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function str(formData: FormData, key: string): string | null {
  const v = String(formData.get(key) ?? "").trim();
  return v || null;
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function dateOrNull(formData: FormData, key: string): Date | null {
  const v = str(formData, key);
  return v ? new Date(v) : null;
}

async function nextPoNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.purchaseOrder.count();
  return `PO-${year}-${String(count + 1).padStart(3, "0")}`;
}

export async function createPurchaseOrder(formData: FormData) {
  const jobId = num(formData, "jobId");
  const phaseIdRaw = str(formData, "phaseId");
  const poNumber = await nextPoNumber();

  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: num(formData, "supplierId"),
      jobId,
      phaseId: phaseIdRaw ? Number(phaseIdRaw) : null,
      status: str(formData, "status") ?? "DRAFT",
      requestedBy: str(formData, "requestedBy"),
      requiredDate: dateOrNull(formData, "requiredDate"),
      deliveryAddress: str(formData, "deliveryAddress"),
      instructions: str(formData, "instructions"),
      lines: {
        create: [
          {
            description: str(formData, "description") ?? "Item",
            quantity: num(formData, "quantity", 1),
            unitCost: num(formData, "unitCost"),
          },
        ],
      },
    },
  });

  revalidatePath("/purchase-orders");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/purchase-orders/${po.id}`);
}

export async function addPoLine(poId: number, jobId: number, formData: FormData) {
  await prisma.purchaseOrderLine.create({
    data: {
      purchaseOrderId: poId,
      description: str(formData, "description") ?? "Item",
      quantity: num(formData, "quantity", 1),
      unitCost: num(formData, "unitCost"),
    },
  });
  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/jobs/${jobId}`);
}

export async function deletePoLine(poId: number, jobId: number, lineId: number) {
  await prisma.purchaseOrderLine.delete({ where: { id: lineId } });
  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/jobs/${jobId}`);
}

export async function setPoStatus(poId: number, jobId: number, formData: FormData) {
  await prisma.purchaseOrder.update({
    where: { id: poId },
    data: {
      status: str(formData, "status") ?? "DRAFT",
      approvedBy: str(formData, "approvedBy") ?? undefined,
    },
  });
  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath("/purchase-orders");
  revalidatePath(`/jobs/${jobId}`);
}

export async function deletePurchaseOrder(poId: number, jobId: number) {
  await prisma.purchaseOrder.delete({ where: { id: poId } });
  revalidatePath("/purchase-orders");
  revalidatePath(`/jobs/${jobId}`);
  redirect(`/jobs/${jobId}`);
}

export async function recordSupplierInvoice(poId: number, jobId: number, formData: FormData) {
  const po = await prisma.purchaseOrder.findUnique({ where: { id: poId } });
  if (!po) throw new Error("Purchase order not found");

  const amount = num(formData, "amount");
  const category = str(formData, "category") ?? "MATERIALS";
  const invoiceNumber = str(formData, "invoiceNumber") ?? "";
  const date = dateOrNull(formData, "date") ?? new Date();

  const costEntry = await prisma.jobCostEntry.create({
    data: {
      jobId,
      phaseId: po.phaseId,
      date,
      category,
      description: `Supplier invoice ${invoiceNumber} (${po.poNumber})`,
      amount,
    },
  });

  await prisma.supplierInvoice.create({
    data: {
      supplierId: po.supplierId,
      purchaseOrderId: poId,
      jobId,
      phaseId: po.phaseId,
      invoiceNumber,
      category,
      date,
      dueDate: dateOrNull(formData, "dueDate"),
      amount,
      jobCostEntryId: costEntry.id,
    },
  });

  await prisma.purchaseOrder.update({ where: { id: poId }, data: { status: "INVOICED" } });

  revalidatePath(`/purchase-orders/${poId}`);
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/purchase-orders");
}
