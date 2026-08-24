import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getAllSitesWithCustomer, getCustomers, getEmployees } from "@/lib/queries";
import { JobForm } from "../JobForm";
import { createJob } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewJobPage({ searchParams }: { searchParams: Promise<{ customerId?: string }> }) {
  const { customerId } = await searchParams;
  const [customers, sites, employees] = await Promise.all([getCustomers(true), getAllSitesWithCustomer(), getEmployees(true)]);

  return (
    <div>
      <PageHeader title="New job" />
      <Card>
        <JobForm
          action={createJob}
          customers={customers}
          sites={sites}
          employees={employees}
          defaultCustomerId={customerId ? Number(customerId) : undefined}
        />
      </Card>
    </div>
  );
}
