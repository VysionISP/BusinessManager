import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { OverheadForm } from "../OverheadForm";
import { createOverhead } from "../actions";

export default function NewOverheadPage() {
  return (
    <div>
      <PageHeader title="Add overhead expense" />
      <Card>
        <OverheadForm action={createOverhead} />
      </Card>
    </div>
  );
}
