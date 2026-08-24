import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { JobForm } from "../JobForm";
import { createJob } from "../actions";

export default function NewJobPage() {
  return (
    <div>
      <PageHeader title="New job" />
      <Card>
        <JobForm action={createJob} />
      </Card>
    </div>
  );
}
