import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency } from "@/lib/format";
import { purchaseOrderTotal } from "@/lib/calculations";
import { OPEN_PO_STATUSES, PO_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PurchaseOrdersPage() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { supplier: true, job: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

  const totalCommitted = pos.filter((po) => OPEN_PO_STATUSES.includes(po.status as (typeof OPEN_PO_STATUSES)[number])).reduce((sum, po) => sum + purchaseOrderTotal(po), 0);

  return (
    <div>
      <PageHeader
        title="Purchase orders"
        description="Money committed to suppliers — counted against a job's forecast cost before the bill arrives."
        actions={
          <Link href="/purchase-orders/new">
            <Button>New purchase order</Button>
          </Link>
        }
      />

      <div className="mb-5 rounded-lg border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-sm text-slate-500 dark:text-slate-400">Total committed (open POs)</span>
        <div className="text-2xl font-semibold text-blue-600">{formatCurrency(totalCommitted)}</div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">PO #</th>
                <th className="py-2 pr-4">Supplier</th>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {pos.map((po) => (
                <tr key={po.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                  <td className="py-2 pr-4 font-medium">
                    <Link href={`/purchase-orders/${po.id}`} className="text-blue-600 hover:underline">
                      {po.poNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{po.supplier.name}</td>
                  <td className="py-2 pr-4">
                    <Link href={`/jobs/${po.jobId}`} className="hover:underline">
                      {po.job.jobNumber}
                    </Link>
                  </td>
                  <td className="py-2 pr-4">{formatCurrency(purchaseOrderTotal(po))}</td>
                  <td className="py-2 pr-4">
                    <TrafficBadge
                      severity={po.status === "CLOSED" || po.status === "INVOICED" ? "green" : po.status === "CANCELLED" ? "red" : "orange"}
                      label={PO_STATUS_LABELS[po.status as keyof typeof PO_STATUS_LABELS] ?? po.status}
                    />
                  </td>
                </tr>
              ))}
              {pos.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No purchase orders yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
