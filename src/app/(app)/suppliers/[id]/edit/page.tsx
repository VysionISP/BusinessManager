import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { SupplierForm } from "../../SupplierForm";
import { updateSupplier } from "../../actions";

export default async function EditSupplierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({ where: { id: Number(id) } });
  if (!supplier) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${supplier.name}`} />
      <Card>
        <SupplierForm supplier={supplier} action={updateSupplier.bind(null, supplier.id)} />
      </Card>
    </div>
  );
}
