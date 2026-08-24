import Link from "next/link";
import { Button, FormActions, FormField } from "@/components/FormField";
import { STOCK_UNITS } from "@/lib/types";
import type { StockItem } from "@prisma/client";

export function StockItemForm({
  item,
  defaultBarcode,
  action,
}: {
  item?: StockItem;
  defaultBarcode?: string;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" name="name" defaultValue={item?.name} required />
        <FormField label="SKU" name="sku" defaultValue={item?.sku ?? undefined} />
        <FormField label="Barcode" name="barcode" defaultValue={item?.barcode ?? defaultBarcode} hint="Scanned or typed barcode / QR value." />
        <FormField label="Category" name="category" defaultValue={item?.category ?? undefined} hint="e.g. Cable, Switchgear, Consumables" />
        <FormField label="Unit" name="unit" defaultValue={item?.unit ?? "EA"} options={STOCK_UNITS.map((u) => ({ value: u, label: u }))} />
        <FormField label="Location" name="location" defaultValue={item?.location ?? undefined} hint="Van, shelf, warehouse bay, etc." />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {!item && <FormField label="Opening quantity" name="quantityOnHand" type="number" step="0.01" defaultValue={0} />}
        <FormField label="Reorder level" name="reorderLevel" type="number" step="0.01" defaultValue={item?.reorderLevel ?? 0} hint="Flag when on-hand drops to this." />
        <FormField label="Unit cost ($)" name="unitCost" type="number" step="0.01" defaultValue={item?.unitCost ?? 0} />
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input type="checkbox" name="active" defaultChecked={item?.active ?? true} className="rounded border-slate-300" />
        Active
      </label>

      <FormActions>
        <Button>{item ? "Save item" : "Add item"}</Button>
        <Link href="/stock" className="text-sm font-medium text-slate-500 hover:underline">
          Cancel
        </Link>
      </FormActions>
    </form>
  );
}
