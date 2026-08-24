import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { EmployeeForm } from "../EmployeeForm";
import { createEmployee } from "../actions";

export default function NewEmployeePage() {
  return (
    <div>
      <PageHeader title="Add employee" />
      <Card>
        <EmployeeForm action={createEmployee} />
      </Card>
    </div>
  );
}
