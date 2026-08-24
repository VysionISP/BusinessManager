import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { prisma } from "@/lib/db";
import { TemplateForm } from "../../../TemplateForm";
import { updateFormTemplate } from "../../../actions";

export default async function EditFormTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const template = await prisma.formTemplate.findUnique({ where: { id: Number(id) } });
  if (!template) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${template.name}`} />
      <Card>
        <TemplateForm template={template} action={updateFormTemplate.bind(null, template.id)} />
      </Card>
    </div>
  );
}
