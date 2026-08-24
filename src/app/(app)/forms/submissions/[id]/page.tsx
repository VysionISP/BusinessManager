import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import type { FormFieldDef } from "@/lib/types";
import { deleteFormSubmission } from "../../actions";

export const dynamic = "force-dynamic";

export default async function SubmissionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const submission = await prisma.formSubmission.findUnique({
    where: { id: Number(id) },
    include: { formTemplate: true, job: true, phase: true },
  });
  if (!submission) notFound();

  const fields: FormFieldDef[] = JSON.parse(submission.formTemplate.fieldsJson);
  const answers: Record<string, string> = JSON.parse(submission.answersJson);

  return (
    <div>
      <PageHeader
        title={submission.formTemplate.name}
        description={`Submitted ${formatDate(submission.submittedAt)} by ${submission.submittedBy ?? "—"}${submission.job ? ` for ${submission.job.jobNumber}` : ""}${submission.phase ? ` (${submission.phase.name})` : ""}`}
        actions={
          <form action={deleteFormSubmission.bind(null, submission.id, submission.jobId)}>
            <Button variant="danger">Delete</Button>
          </form>
        }
      />
      <Card>
        <dl className="space-y-4">
          {fields.map((field) => (
            <div key={field.id}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{field.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">{answers[field.id] || "—"}</dd>
            </div>
          ))}
        </dl>
        {submission.job && (
          <Link href={`/jobs/${submission.job.id}`} className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
            ← Back to {submission.job.jobNumber}
          </Link>
        )}
      </Card>
    </div>
  );
}
