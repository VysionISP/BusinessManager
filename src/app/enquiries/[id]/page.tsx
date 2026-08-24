import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { ENQUIRY_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";
import { getAllSitesWithCustomer, getCustomers } from "@/lib/queries";
import { EnquiryForm } from "../EnquiryForm";
import { convertEnquiryToJob, deleteEnquiry, updateEnquiry } from "../actions";

export const dynamic = "force-dynamic";

export default async function EnquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const enquiryId = Number(id);
  const [enquiry, customers, sites] = await Promise.all([
    prisma.enquiry.findUnique({ where: { id: enquiryId }, include: { customer: true } }),
    getCustomers(true),
    getAllSitesWithCustomer(),
  ]);
  if (!enquiry) notFound();

  const alreadyConverted = enquiry.status === "CONVERTED";

  return (
    <div>
      <PageHeader
        title={enquiry.workRequested}
        description={`${ENQUIRY_STATUS_LABELS[enquiry.status as keyof typeof ENQUIRY_STATUS_LABELS] ?? enquiry.status}${enquiry.customer ? ` · ${enquiry.customer.name}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            {!alreadyConverted && (
              <form action={convertEnquiryToJob.bind(null, enquiryId)}>
                <Button>Convert to job</Button>
              </form>
            )}
            <form action={deleteEnquiry.bind(null, enquiryId)}>
              <Button variant="danger">Delete</Button>
            </form>
          </div>
        }
      />
      <Card>
        <EnquiryForm enquiry={enquiry} customers={customers} sites={sites} action={updateEnquiry.bind(null, enquiryId)} />
      </Card>
    </div>
  );
}
