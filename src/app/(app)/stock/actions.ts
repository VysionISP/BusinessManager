"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string, fallback = 0): number {
  const raw = formData.get(key);
  if (raw === null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function itemData(formData: FormData) {
  return {
    name: str(formData, "name"),
    sku: str(formData, "sku") || null,
    barcode: str(formData, "barcode") || null,
    category: str(formData, "category") || null,
    unit: str(formData, "unit") || "EA",
    reorderLevel: num(formData, "reorderLevel"),
    unitCost: num(formData, "unitCost"),
    location: str(formData, "location") || null,
    active: formData.get("active") === "on",
  };
}

export async function createStockItem(formData: FormData) {
  const quantityOnHand = num(formData, "quantityOnHand");
  const item = await prisma.stockItem.create({ data: { ...itemData(formData), quantityOnHand } });
  if (quantityOnHand > 0) {
    await prisma.stockMovement.create({ data: { stockItemId: item.id, type: "RECEIVE", quantity: quantityOnHand, note: "Opening stock" } });
  }
  await logAudit("StockItem", item.id, "CREATE", `Added stock item ${item.name}`);
  revalidatePath("/stock");
  redirect(`/stock/${item.id}`);
}

export async function updateStockItem(id: number, formData: FormData) {
  await prisma.stockItem.update({ where: { id }, data: itemData(formData) });
  revalidatePath("/stock");
  revalidatePath(`/stock/${id}`);
  redirect(`/stock/${id}`);
}

export async function deleteStockItem(id: number) {
  await prisma.stockItem.delete({ where: { id } });
  revalidatePath("/stock");
  redirect("/stock");
}

export async function receiveStock(id: number, formData: FormData) {
  const quantity = num(formData, "quantity");
  const note = str(formData, "note") || null;
  if (quantity > 0) {
    await prisma.$transaction([
      prisma.stockMovement.create({ data: { stockItemId: id, type: "RECEIVE", quantity, note } }),
      prisma.stockItem.update({ where: { id }, data: { quantityOnHand: { increment: quantity } } }),
    ]);
  }
  revalidatePath(`/stock/${id}`);
  revalidatePath("/stock");
  redirect(`/stock/${id}`);
}

export async function adjustStock(id: number, formData: FormData) {
  const quantity = num(formData, "quantity"); // signed — positive tops up, negative writes down
  const note = str(formData, "note") || null;
  if (quantity !== 0) {
    await prisma.$transaction([
      prisma.stockMovement.create({ data: { stockItemId: id, type: "ADJUSTMENT", quantity, note } }),
      prisma.stockItem.update({ where: { id }, data: { quantityOnHand: { increment: quantity } } }),
    ]);
  }
  revalidatePath(`/stock/${id}`);
  revalidatePath("/stock");
  redirect(`/stock/${id}`);
}

export async function issueStockToJob(id: number, formData: FormData) {
  const quantity = num(formData, "quantity");
  const jobId = Number(formData.get("jobId"));

  if (quantity > 0 && jobId) {
    const item = await prisma.stockItem.findUnique({ where: { id } });
    if (item) {
      const amount = quantity * item.unitCost;
      await prisma.$transaction([
        prisma.stockMovement.create({ data: { stockItemId: id, type: "ISSUE", quantity: -quantity, jobId, note: "Issued to job" } }),
        prisma.stockItem.update({ where: { id }, data: { quantityOnHand: { decrement: quantity } } }),
        prisma.jobCostEntry.create({
          data: {
            jobId,
            date: new Date(),
            category: "MATERIALS",
            description: `${item.name} (${quantity} ${item.unit}) from stock`,
            amount,
          },
        }),
      ]);
      revalidatePath(`/jobs/${jobId}`);
    }
  }

  revalidatePath(`/stock/${id}`);
  revalidatePath("/stock");
  redirect(`/stock/${id}`);
}
