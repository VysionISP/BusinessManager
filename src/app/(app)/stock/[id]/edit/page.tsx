import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { StockItemForm } from "../../StockItemForm";
import { updateStockItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditStockItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const item = await prisma.stockItem.findUnique({ where: { id: Number(id) } });
  if (!item) notFound();

  const boundUpdate = updateStockItem.bind(null, item.id);

  return (
    <div>
      <PageHeader title={`Edit ${item.name}`} />
      <Card>
        <StockItemForm item={item} action={boundUpdate} />
      </Card>
    </div>
  );
}
