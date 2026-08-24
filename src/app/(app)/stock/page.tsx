import Link from "next/link";
import { redirect } from "next/navigation";
import { Boxes } from "lucide-react";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { MetricBox } from "@/components/StatTile";
import { BarcodeScanButton } from "@/components/BarcodeScan";
import { formatCurrency } from "@/lib/format";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StockPage({ searchParams }: { searchParams: Promise<{ barcode?: string }> }) {
  const { barcode } = await searchParams;

  if (barcode) {
    const match = await prisma.stockItem.findUnique({ where: { barcode } });
    if (match) redirect(`/stock/${match.id}`);
  }

  const items = await prisma.stockItem.findMany({ orderBy: { name: "asc" } });
  const totalValue = items.reduce((sum, i) => sum + i.quantityOnHand * i.unitCost, 0);
  const lowStockCount = items.filter((i) => i.active && i.quantityOnHand <= i.reorderLevel).length;

  return (
    <div>
      <PageHeader
        title="Stock"
        description="Materials and equipment on hand — scan a barcode to jump straight to an item, or issue stock against a job."
        actions={
          <div className="flex items-center gap-2">
            <BarcodeScanButton />
            <Link href="/stock/new">
              <Button>Add item</Button>
            </Link>
          </div>
        }
      />

      {barcode && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          No stock item found for barcode &quot;{barcode}&quot; —{" "}
          <Link href={`/stock/new?barcode=${encodeURIComponent(barcode)}`} className="font-medium underline">
            add one
          </Link>
          .
        </p>
      )}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <MetricBox label="Total stock value" value={formatCurrency(totalValue)} />
        <MetricBox label="Items at or below reorder level" value={String(lowStockCount)} tone={lowStockCount > 0 ? "rose" : "emerald"} />
      </div>

      <Card title="Stock items" icon={Boxes}>
        <Table>
          <THead>
            <Th>Item</Th>
            <Th>Category</Th>
            <Th>On hand</Th>
            <Th>Value</Th>
            <Th>Location</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {items.map((item) => {
              const low = item.quantityOnHand <= item.reorderLevel;
              return (
                <Tr key={item.id}>
                  <Td className="font-medium">
                    <Link href={`/stock/${item.id}`} className="text-indigo-600 hover:underline">
                      {item.name}
                    </Link>
                    {item.sku && <span className="block text-xs text-slate-400">{item.sku}</span>}
                  </Td>
                  <Td className="text-slate-500 dark:text-slate-400">{item.category ?? "—"}</Td>
                  <Td>
                    <TrafficBadge severity={low ? "red" : "green"} label={`${item.quantityOnHand} ${item.unit}`} />
                  </Td>
                  <Td>{formatCurrency(item.quantityOnHand * item.unitCost)}</Td>
                  <Td>{item.location ?? "—"}</Td>
                  <Td>{item.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
                </Tr>
              );
            })}
            {items.length === 0 && <EmptyRow colSpan={6}>No stock items yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}
