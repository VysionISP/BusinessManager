import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { deleteFormTemplate } from "./actions";

export const dynamic = "force-dynamic";

export default async function FormsPage() {
  const templates = await prisma.formTemplate.findMany({
    where: { active: true },
    include: { _count: { select: { submissions: true } } },
    orderBy: { name: "asc" },
  });
  const recentSubmissions = await prisma.formSubmission.findMany({
    include: { formTemplate: true, job: true },
    orderBy: { submittedAt: "desc" },
    take: 15,
  });

  const forms = templates.filter((t) => !t.isCertificate);
  const certificates = templates.filter((t) => t.isCertificate);

  return (
    <div>
      <PageHeader
        title="Forms & certificates"
        description="Build reusable forms (SWMS, Take 5, test sheets, sign-offs) and fill them out against a job from the job page."
        actions={
          <Link href="/forms/templates/new">
            <Button>New form template</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Forms">
          <TemplateTable templates={forms} />
        </Card>
        <Card title="Certificates">
          <TemplateTable templates={certificates} />
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Recent submissions">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Form</th>
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Submitted by</th>
                </tr>
              </thead>
              <tbody>
                {recentSubmissions.map((s) => (
                  <tr key={s.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4">{formatDate(s.submittedAt)}</td>
                    <td className="py-2 pr-4">
                      <Link href={`/forms/submissions/${s.id}`} className="text-blue-600 hover:underline">
                        {s.formTemplate.name}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{s.job ? <Link href={`/jobs/${s.job.id}`} className="hover:underline">{s.job.jobNumber}</Link> : "—"}</td>
                    <td className="py-2 pr-4">{s.submittedBy ?? "—"}</td>
                  </tr>
                ))}
                {recentSubmissions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-slate-400">
                      No submissions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function TemplateTable({ templates }: { templates: { id: number; name: string; description: string | null; _count: { submissions: number } }[] }) {
  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm dark:border-slate-800">
          <div>
            <div className="font-medium">{t.name}</div>
            {t.description && <div className="text-xs text-slate-500 dark:text-slate-400">{t.description}</div>}
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400">{t._count.submissions} submitted</span>
            <Link href={`/forms/templates/${t.id}/edit`} className="text-blue-600 hover:underline">
              Edit
            </Link>
            <form action={deleteFormTemplate.bind(null, t.id)}>
              <button type="submit" className="text-rose-600 hover:underline">
                Delete
              </button>
            </form>
          </div>
        </div>
      ))}
      {templates.length === 0 && <p className="text-sm text-slate-400">None yet.</p>}
    </div>
  );
}
