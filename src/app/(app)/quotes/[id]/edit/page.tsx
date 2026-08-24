import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { getAllSitesWithCustomer, getCustomers } from "@/lib/queries";
import { QuoteHeaderForm } from "../../QuoteHeaderForm";
import { updateQuote } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [quote, customers, sites] = await Promise.all([
    prisma.quote.findUnique({ where: { id: Number(id) } }),
    getCustomers(true),
    getAllSitesWithCustomer(),
  ]);
  if (!quote) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${quote.quoteNumber}`} />
      <Card>
        <QuoteHeaderForm quote={quote} customers={customers} sites={sites} action={updateQuote.bind(null, quote.id)} />
      </Card>
    </div>
  );
}
