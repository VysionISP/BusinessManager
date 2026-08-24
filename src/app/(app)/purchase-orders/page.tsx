import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { MetricBox } from "@/components/StatTile";
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

      <div className="mb-5">
        <MetricBox label="Total committed (open POs)" value={formatCurrency(totalCommitted)} />
      </div>

      <Card>
        <Table>
          <THead>
            <Th>PO #</Th>
            <Th>Supplier</Th>
            <Th>Job</Th>
            <Th>Total</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {pos.map((po) => (
              <Tr key={po.id}>
                <Td className="font-medium">
                  <Link href={`/purchase-orders/${po.id}`} className="text-indigo-600 hover:underline">
                    {po.poNumber}
                  </Link>
                </Td>
                <Td>{po.supplier.name}</Td>
                <Td>
                  <Link href={`/jobs/${po.jobId}`} className="hover:underline">
                    {po.job.jobNumber}
                  </Link>
                </Td>
                <Td>{formatCurrency(purchaseOrderTotal(po))}</Td>
                <Td>
                  <TrafficBadge
                    severity={po.status === "CLOSED" || po.status === "INVOICED" ? "green" : po.status === "CANCELLED" ? "red" : "orange"}
                    label={PO_STATUS_LABELS[po.status as keyof typeof PO_STATUS_LABELS] ?? po.status}
                  />
                </Td>
              </Tr>
            ))}
            {pos.length === 0 && <EmptyRow colSpan={5}>No purchase orders yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
