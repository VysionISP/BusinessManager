import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { OverheadForm } from "../../OverheadForm";
import { updateOverhead } from "../../actions";

export default async function EditOverheadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const overhead = await prisma.overheadExpense.findUnique({ where: { id: Number(id) } });
  if (!overhead) notFound();

  const boundUpdate = updateOverhead.bind(null, overhead.id);

  return (
    <div>
      <PageHeader title={`Edit ${overhead.name}`} />
      <Card>
        <OverheadForm overhead={overhead} action={boundUpdate} />
      </Card>
    </div>
  );
}
