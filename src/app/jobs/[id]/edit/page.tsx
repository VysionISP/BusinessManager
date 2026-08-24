import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { JobForm } from "../../JobForm";
import { updateJob } from "../../actions";

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await prisma.job.findUnique({ where: { id: Number(id) } });
  if (!job) notFound();

  const boundUpdate = updateJob.bind(null, job.id);

  return (
    <div>
      <PageHeader title={`Edit ${job.jobNumber}`} />
      <Card>
        <JobForm job={job} action={boundUpdate} />
      </Card>
    </div>
  );
}
