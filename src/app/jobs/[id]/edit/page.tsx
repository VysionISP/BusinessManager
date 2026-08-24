import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { getAllSitesWithCustomer, getCustomers, getEmployees } from "@/lib/queries";
import { JobForm } from "../../JobForm";
import { updateJob } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [job, customers, sites, employees] = await Promise.all([
    prisma.job.findUnique({ where: { id: Number(id) } }),
    getCustomers(true),
    getAllSitesWithCustomer(),
    getEmployees(true),
  ]);
  if (!job) notFound();

  const boundUpdate = updateJob.bind(null, job.id);

  return (
    <div>
      <PageHeader title={`Edit ${job.jobNumber}`} />
      <Card>
        <JobForm job={job} action={boundUpdate} customers={customers} sites={sites} employees={employees} />
      </Card>
    </div>
  );
}
