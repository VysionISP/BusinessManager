import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getAllSitesWithCustomer, getCustomers } from "@/lib/queries";
import { EnquiryForm } from "../EnquiryForm";
import { createEnquiry } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewEnquiryPage() {
  const [customers, sites] = await Promise.all([getCustomers(true), getAllSitesWithCustomer()]);

  return (
    <div>
      <PageHeader title="New enquiry" />
      <Card>
        <EnquiryForm action={createEnquiry} customers={customers} sites={sites} />
      </Card>
    </div>
  );
}
