"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2 } from "lucide-react";
import { Td, Tr } from "@/components/Table";
import { FormField } from "@/components/FormField";
import { formatCurrency } from "@/lib/format";
import { invoiceLineTotal, type InvoiceLineLike } from "@/lib/calculations";
import type { InvoiceLine } from "@prisma/client";

export function InvoiceLineRow({
  line,
  canMoveUp,
  canMoveDown,
  updateAction,
  deleteAction,
  moveAction,
}: {
  line: InvoiceLine;
  canMoveUp: boolean;
  canMoveDown: boolean;
  updateAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => void;
  moveAction: (direction: "up" | "down") => void;
}) {
  const [editing, setEditing] = useState(false);
  const lineLike: InvoiceLineLike = line;

  if (editing) {
    return (
      <Tr>
        <td colSpan={7} className="p-0">
          <form
            action={async (formData) => {
              await updateAction(formData);
              setEditing(false);
            }}
            className="grid grid-cols-2 gap-2 border-y border-indigo-100 bg-indigo-50/40 p-3 sm:grid-cols-6 sm:items-end dark:border-indigo-500/20 dark:bg-indigo-500/5"
          >
            <div className="col-span-2 sm:col-span-2">
              <FormField label="Description" name="description" defaultValue={line.description} required />
            </div>
            <FormField label="Qty" name="quantity" type="number" step="0.01" defaultValue={line.quantity} />
            <FormField label="UoM" name="unit" defaultValue={line.unit} />
            <FormField label="Unit price ($)" name="unitPrice" type="number" step="0.01" defaultValue={line.unitPrice} />
            <FormField label="Tax (%)" name="taxPercent" type="number" step="0.1" defaultValue={line.taxPercent} />
            <div className="col-span-2 flex items-end gap-2 sm:col-span-6">
              <button type="submit" className="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
            </div>
          </form>
        </td>
      </Tr>
    );
  }

  return (
    <Tr>
      <Td>{line.description}</Td>
      <Td>{line.quantity}</Td>
      <Td className="text-slate-500 dark:text-slate-400">{line.unit}</Td>
      <Td>{formatCurrency(line.unitPrice, true)}</Td>
      <Td className="text-slate-500 dark:text-slate-400">{line.taxPercent > 0 ? `${line.taxPercent}%` : "—"}</Td>
      <Td className="font-medium">{formatCurrency(invoiceLineTotal(lineLike))}</Td>
      <Td className="text-right">
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={() => moveAction("up")}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={() => moveAction("down")}
            className="rounded p-1 text-slate-400 hover:bg-slate-100 disabled:opacity-30 dark:hover:bg-slate-800"
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={() => setEditing(true)} className="rounded p-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10" aria-label="Edit line">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <form action={deleteAction}>
            <button type="submit" className="rounded p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10" aria-label="Delete line">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </Td>
    </Tr>
  );
}
