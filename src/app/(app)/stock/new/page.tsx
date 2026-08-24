import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StockItemForm } from "../StockItemForm";
import { createStockItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewStockItemPage({ searchParams }: { searchParams: Promise<{ barcode?: string }> }) {
  const { barcode } = await searchParams;

  return (
    <div>
      <PageHeader title="Add stock item" description="Materials and equipment tracked for on-hand quantity and job usage." />
      <Card>
        <StockItemForm action={createStockItem} defaultBarcode={barcode} />
      </Card>
    </div>
  );
}
