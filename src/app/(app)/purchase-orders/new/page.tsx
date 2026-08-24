import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { getJobsForSelection } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { PurchaseOrderForm } from "../PurchaseOrderForm";
import { createPurchaseOrder } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewPurchaseOrderPage({ searchParams }: { searchParams: Promise<{ jobId?: string }> }) {
  const { jobId } = await searchParams;
  const [jobs, suppliers] = await Promise.all([getJobsForSelection(), prisma.supplier.findMany({ where: { active: true }, orderBy: { name: "asc" } })]);

  const jobOptions = jobs.map((j) => ({ id: j.id, jobNumber: j.jobNumber, customerName: j.customer.name }));
  const phaseOptions = jobs.flatMap((j) => j.phases.map((p) => ({ id: p.id, name: p.name, jobId: j.id })));

  return (
    <div>
      <PageHeader title="New purchase order" description="Committed cost — counted against the job before the supplier bill even arrives." />
      <Card>
        {jobs.length === 0 || suppliers.length === 0 ? (
          <p className="text-sm text-slate-500">
            You need at least one job and one active supplier before raising a purchase order.
          </p>
        ) : (
          <PurchaseOrderForm action={createPurchaseOrder} jobs={jobOptions} phases={phaseOptions} suppliers={suppliers} defaultJobId={jobId ? Number(jobId) : undefined} />
        )}
      </Card>
    </div>
  );
}
