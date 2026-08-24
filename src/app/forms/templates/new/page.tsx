import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TemplateForm } from "../../TemplateForm";
import { createFormTemplate } from "../../actions";

export default function NewFormTemplatePage() {
  return (
    <div>
      <PageHeader title="New form template" />
      <Card>
        <TemplateForm action={createFormTemplate} />
      </Card>
    </div>
  );
}
