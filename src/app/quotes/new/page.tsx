import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getAllSitesWithCustomer, getCustomers } from "@/lib/queries";
import { QuoteHeaderForm } from "../QuoteHeaderForm";
import { createQuote } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const [customers, sites] = await Promise.all([getCustomers(true), getAllSitesWithCustomer()]);

  return (
    <div>
      <PageHeader title="New quote" description="Add line items once the quote is created." />
      <Card>
        <QuoteHeaderForm action={createQuote} customers={customers} sites={sites} />
      </Card>
    </div>
  );
}
