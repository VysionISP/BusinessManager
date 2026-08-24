import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { CustomerForm } from "../../CustomerForm";
import { updateCustomer } from "../../actions";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id: Number(id) } });
  if (!customer) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${customer.name}`} />
      <Card>
        <CustomerForm customer={customer} action={updateCustomer.bind(null, customer.id)} />
      </Card>
    </div>
  );
}
