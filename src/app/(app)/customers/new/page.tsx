import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { CustomerForm } from "../CustomerForm";
import { createCustomer } from "../actions";

export default function NewCustomerPage() {
  return (
    <div>
      <PageHeader title="Add customer" />
      <Card>
        <CustomerForm action={createCustomer} />
      </Card>
    </div>
  );
}
