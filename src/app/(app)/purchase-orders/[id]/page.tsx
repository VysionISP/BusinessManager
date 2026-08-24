import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormField } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate } from "@/lib/format";
import { purchaseOrderTotal } from "@/lib/calculations";
import { PO_STATUSES, PO_STATUS_LABELS, SUPPLIER_INVOICE_CATEGORIES } from "@/lib/types";
import { prisma } from "@/lib/db";
import { addPoLine, deletePoLine, deletePurchaseOrder, recordSupplierInvoice, setPoStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function PurchaseOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const poId = Number(id);
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { supplier: true, job: true, phase: true, lines: true, supplierInvoices: true },
  });
  if (!po) notFound();

  const total = purchaseOrderTotal(po);
  const invoiced = po.supplierInvoices.reduce((sum, si) => sum + si.amount, 0);

  return (
    <div>
      <PageHeader
        title={po.poNumber}
        description={`${po.supplier.name} · for ${po.job.jobNumber}${po.phase ? ` (${po.phase.name})` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <TrafficBadge
              severity={po.status === "CLOSED" || po.status === "INVOICED" ? "green" : po.status === "CANCELLED" ? "red" : "orange"}
              label={PO_STATUS_LABELS[po.status as keyof typeof PO_STATUS_LABELS] ?? po.status}
            />
            <form action={deletePurchaseOrder.bind(null, poId, po.jobId)}>
              <Button variant="danger">Delete</Button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Line items">
            <div className="mb-4">
              <form action={addPoLine.bind(null, poId, po.jobId)} className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:items-end">
                <div className="col-span-2">
                  <FormField label="Description" name="description" required />
                </div>
                <FormField label="Quantity" name="quantity" type="number" step="0.01" defaultValue={1} />
                <FormField label="Unit cost ($)" name="unitCost" type="number" step="0.01" defaultValue={0} />
                <button type="submit" className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-4">
                  Add line
                </button>
              </form>
            </div>
            <Table>
              <THead>
                <Th>Description</Th>
                <Th>Qty</Th>
                <Th>Unit cost</Th>
                <Th>Total</Th>
                <Th />
              </THead>
              <tbody>
                {po.lines.map((line) => (
                  <Tr key={line.id}>
                    <Td>{line.description}</Td>
                    <Td>{line.quantity}</Td>
                    <Td>{formatCurrency(line.unitCost, true)}</Td>
                    <Td className="font-medium">{formatCurrency(line.quantity * line.unitCost)}</Td>
                    <Td className="text-right">
                      <form action={deletePoLine.bind(null, poId, po.jobId, line.id)}>
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-4 border-t border-slate-100 pt-3 text-right text-sm font-semibold dark:border-slate-800">Total: {formatCurrency(total)}</div>
          </Card>

          <Card title="Supplier invoices against this PO">
            {po.supplierInvoices.length > 0 && (
              <ul className="mb-4 space-y-2 text-sm">
                {po.supplierInvoices.map((si) => (
                  <li key={si.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                    <span>
                      {si.invoiceNumber} · {formatDate(si.date)}
                    </span>
                    <span className="font-medium">{formatCurrency(si.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            {invoiced < total && (
              <form action={recordSupplierInvoice.bind(null, poId, po.jobId)} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <FormField label="Invoice #" name="invoiceNumber" required />
                <FormField
                  label="Category"
                  name="category"
                  defaultValue="MATERIALS"
                  options={SUPPLIER_INVOICE_CATEGORIES.map((c) => ({ value: c, label: c.charAt(0) + c.slice(1).toLowerCase() }))}
                />
                <FormField label="Amount ($)" name="amount" type="number" step="0.01" defaultValue={total - invoiced} required />
                <FormField label="Date" name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required />
                <FormField label="Due date" name="dueDate" type="date" />
                <div className="flex items-end">
                  <button type="submit" className="rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                    Record invoice
                  </button>
                </div>
              </form>
            )}
            <p className="mt-3 text-xs text-slate-400">Recording a supplier invoice here posts a matching actual cost entry to the job automatically.</p>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Status">
            <form action={setPoStatus.bind(null, poId, po.jobId)} className="space-y-3">
              <FormField label="Status" name="status" defaultValue={po.status} options={PO_STATUSES.map((s) => ({ value: s, label: PO_STATUS_LABELS[s] }))} />
              <FormField label="Approved by" name="approvedBy" defaultValue={po.approvedBy ?? undefined} />
              <Button>Update status</Button>
            </form>
          </Card>

          <Card title="Details">
            <div className="space-y-2 text-sm">
              <Row label="Job" value={<Link href={`/jobs/${po.jobId}`} className="text-indigo-600 hover:underline">{po.job.jobNumber}</Link>} />
              <Row label="Requested by" value={po.requestedBy ?? "—"} />
              <Row label="Required date" value={formatDate(po.requiredDate)} />
              <Row label="Delivery address" value={po.deliveryAddress ?? "—"} />
              {po.instructions && <Row label="Instructions" value={po.instructions} />}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}
