import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormActions, FormField } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { getJobsForSelection } from "@/lib/queries";
import { STOCK_MOVEMENT_TYPE_LABELS } from "@/lib/types";
import { adjustStock, deleteStockItem, issueStockToJob, receiveStock } from "../actions";

export const dynamic = "force-dynamic";

export default async function StockItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);

  const [item, movements, jobs] = await Promise.all([
    prisma.stockItem.findUnique({ where: { id: itemId } }),
    prisma.stockMovement.findMany({ where: { stockItemId: itemId }, include: { job: true }, orderBy: { createdAt: "desc" } }),
    getJobsForSelection(),
  ]);
  if (!item) notFound();

  const low = item.quantityOnHand <= item.reorderLevel;
  const boundReceive = receiveStock.bind(null, itemId);
  const boundAdjust = adjustStock.bind(null, itemId);
  const boundIssue = issueStockToJob.bind(null, itemId);
  const boundDelete = deleteStockItem.bind(null, itemId);

  return (
    <div>
      <PageHeader
        title={item.name}
        description={[item.sku, item.category, item.location].filter(Boolean).join(" · ") || undefined}
        actions={
          <div className="flex items-center gap-2">
            <TrafficBadge severity={low ? "red" : "green"} label={`${item.quantityOnHand} ${item.unit} on hand`} />
            <Link href={`/stock/${itemId}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <form action={boundDelete}>
              <Button variant="danger">Delete</Button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Movement history">
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Quantity</Th>
                <Th>Job</Th>
                <Th>Note</Th>
              </THead>
              <tbody>
                {movements.map((m) => (
                  <Tr key={m.id}>
                    <Td>{formatDate(m.createdAt)}</Td>
                    <Td>{STOCK_MOVEMENT_TYPE_LABELS[m.type as keyof typeof STOCK_MOVEMENT_TYPE_LABELS] ?? m.type}</Td>
                    <Td className={m.quantity >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {m.quantity >= 0 ? "+" : ""}
                      {m.quantity} {item.unit}
                    </Td>
                    <Td>
                      {m.job ? (
                        <Link href={`/jobs/${m.job.id}`} className="text-blue-600 hover:underline">
                          {m.job.jobNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td className="text-slate-500 dark:text-slate-400">{m.note ?? "—"}</Td>
                  </Tr>
                ))}
                {movements.length === 0 && <EmptyRow colSpan={5}>No movements recorded yet.</EmptyRow>}
              </tbody>
            </Table>
          </Card>
        </div>

        <div className="space-y-5">
          <Card title="Unit cost & value">
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Unit cost</span>
                <span className="font-medium">{formatCurrency(item.unitCost, true)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">On-hand value</span>
                <span className="font-semibold">{formatCurrency(item.quantityOnHand * item.unitCost)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Reorder level</span>
                <span className="font-medium">
                  {item.reorderLevel} {item.unit}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Receive stock">
            <form action={boundReceive} className="space-y-3">
              <FormField label="Quantity received" name="quantity" type="number" step="0.01" required />
              <FormField label="Note" name="note" hint="e.g. PO number or supplier" />
              <FormActions>
                <Button>Receive</Button>
              </FormActions>
            </form>
          </Card>

          <Card title="Issue to job">
            <form action={boundIssue} className="space-y-3">
              <FormField
                label="Job"
                name="jobId"
                required
                options={jobs.map((j) => ({ value: String(j.id), label: `${j.jobNumber} — ${j.customer.name}` }))}
              />
              <FormField label="Quantity" name="quantity" type="number" step="0.01" required />
              <p className="text-xs text-slate-400">Adds a materials cost entry to the job at the item&apos;s unit cost.</p>
              <FormActions>
                <Button>Issue</Button>
              </FormActions>
            </form>
          </Card>

          <Card title="Adjust stock">
            <form action={boundAdjust} className="space-y-3">
              <FormField label="Quantity (+/-)" name="quantity" type="number" step="0.01" required hint="Positive to add, negative to write down." />
              <FormField label="Reason" name="note" hint="e.g. stocktake correction, damaged stock" />
              <FormActions>
                <Button variant="secondary">Adjust</Button>
              </FormActions>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
