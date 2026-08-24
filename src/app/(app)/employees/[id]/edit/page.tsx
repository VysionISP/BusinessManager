import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { EmployeeForm } from "../../EmployeeForm";
import { updateEmployee } from "../../actions";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await prisma.employee.findUnique({ where: { id: Number(id) } });
  if (!employee) notFound();

  const boundUpdate = updateEmployee.bind(null, employee.id);

  return (
    <div>
      <PageHeader title={`Edit ${employee.name}`} />
      <Card>
        <EmployeeForm employee={employee} action={boundUpdate} />
      </Card>
    </div>
  );
}
