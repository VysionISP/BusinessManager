import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { SupplierForm } from "../SupplierForm";
import { createSupplier } from "../actions";

export default function NewSupplierPage() {
  return (
    <div>
      <PageHeader title="Add supplier" />
      <Card>
        <SupplierForm action={createSupplier} />
      </Card>
    </div>
  );
}
