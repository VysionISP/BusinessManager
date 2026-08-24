import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormField } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { quoteTotals, type QuoteLineLike } from "@/lib/calculations";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";
import { AddSectionButton } from "../AddSectionButton";
import { DraggableSections } from "../DraggableSections";
import { SectionCard } from "../SectionCard";
import { addSection, acceptThisVersion, convertQuoteToJob, createNewVersion, deleteQuote, reorderSections, setQuoteStatus } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_SEVERITY: Record<string, "green" | "orange" | "red"> = {
  DRAFT: "orange",
  SENT: "orange",
  ACCEPTED: "green",
  DECLINED: "red",
  EXPIRED: "red",
};

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const quoteId = Number(id);
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      customer: true,
      site: true,
      job: true,
      sections: { orderBy: { sortOrder: "asc" } },
      lines: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!quote) notFound();

  const siblingVersions = await prisma.quote.findMany({
    where: { quoteNumber: quote.quoteNumber },
    orderBy: { version: "desc" },
    select: { id: true, version: true, status: true },
  });
  const latestVersion = siblingVersions[0];
  const acceptedVersion = siblingVersions.find((v) => v.status === "ACCEPTED");
  const isSuperseded = latestVersion.id !== quote.id;

  const totals = quoteTotals(quote.lines as QuoteLineLike[]);
  const boundSetStatus = setQuoteStatus.bind(null, quoteId);
  const boundAddSection = addSection.bind(null, quoteId);

  return (
    <div>
      <PageHeader
        title={`${quote.quoteNumber}${quote.version > 1 ? ` (v${quote.version})` : ""} — ${quote.title}`}
        description={`${quote.customer.name}${quote.site ? ` · ${quote.site.name}` : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <TrafficBadge severity={STATUS_SEVERITY[quote.status] ?? "orange"} label={QUOTE_STATUS_LABELS[quote.status as keyof typeof QUOTE_STATUS_LABELS] ?? quote.status} />
            <Link href={`/quotes/${quoteId}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <form action={deleteQuote.bind(null, quoteId)}>
              <Button variant="danger">Delete</Button>
            </form>
          </div>
        }
      />

      {siblingVersions.length > 1 && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300">
          <span className="font-medium">
            {isSuperseded ? `This quote has been superseded (latest is v${latestVersion.version}).` : `This is the latest version (v${quote.version}).`}
          </span>
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {siblingVersions.map((v) => (
              <Link
                key={v.id}
                href={`/quotes/${v.id}`}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  v.id === quoteId ? "bg-indigo-600 text-white" : "bg-white text-indigo-700 hover:bg-indigo-100 dark:bg-slate-900 dark:text-indigo-300 dark:hover:bg-slate-800"
                }`}
              >
                v{v.version}
                {v.status === "ACCEPTED" ? " ✓" : ""}
              </Link>
            ))}
            {acceptedVersion && acceptedVersion.id !== quoteId && (
              <Link href={`/quotes/${acceptedVersion.id}`} className="text-xs font-semibold underline">
                View accepted
              </Link>
            )}
            {quote.status !== "ACCEPTED" && (
              <form action={acceptThisVersion.bind(null, quoteId)}>
                <button type="submit" className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white hover:bg-emerald-700">
                  Accept this version
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <DraggableSections sectionIds={quote.sections.map((s) => s.id)} reorderAction={reorderSections.bind(null, quoteId)}>
            {quote.sections.map((section, i) => (
              <SectionCard
                key={section.id}
                quoteId={quoteId}
                section={section}
                lines={quote.lines.filter((l) => l.sectionId === section.id)}
                canMoveUp={i > 0}
                canMoveDown={i < quote.sections.length - 1}
              />
            ))}
          </DraggableSections>
          {quote.sections.length === 0 && (
            <Card>
              <p className="text-sm text-slate-400">No sections yet — add one to start building the quote.</p>
            </Card>
          )}

          <AddSectionButton action={boundAddSection} />

          <Card>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Total cost" value={formatCurrency(totals.totalCost)} />
              <Stat label="Subtotal" value={formatCurrency(totals.totalSell)} />
              {totals.totalTax > 0 && <Stat label="Tax" value={formatCurrency(totals.totalTax)} />}
              <Stat label={totals.totalTax > 0 ? "Total (incl. tax)" : "Total"} value={formatCurrency(totals.totalWithTax)} bold />
              <Stat label="Profit" value={formatCurrency(totals.profit)} />
              <Stat label="Margin" value={formatPercent(totals.marginPercent, 1)} />
            </div>
          </Card>

          {(quote.introduction || quote.scopeOfWork || quote.exclusions || quote.termsAndConditions) && (
            <Card title="Quote document">
              {quote.introduction && <Section label="Introduction" text={quote.introduction} />}
              {quote.scopeOfWork && <Section label="Scope of work" text={quote.scopeOfWork} />}
              {quote.exclusions && <Section label="Exclusions" text={quote.exclusions} />}
              {quote.termsAndConditions && <Section label="Terms & conditions" text={quote.termsAndConditions} />}
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card title="Status">
            <form action={boundSetStatus} className="space-y-3">
              <FormField key={quote.status} label="Status" name="status" defaultValue={quote.status} options={QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABELS[s] }))} />
              <FormField label="Accepted by (name)" name="acceptedByName" defaultValue={quote.acceptedByName ?? undefined} hint="Only needed when marking Accepted" />
              <Button>Update status</Button>
            </form>
            {quote.acceptedDate && (
              <p className="mt-3 text-xs text-slate-400">
                Accepted by {quote.acceptedByName} on {formatDate(quote.acceptedDate)}
              </p>
            )}
          </Card>

          <Card title="Actions">
            <div className="space-y-3">
              <form action={createNewVersion.bind(null, quoteId)}>
                <button type="submit" className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
                  + New Version
                </button>
              </form>
              {quote.jobId ? (
                <Link
                  href={`/jobs/${quote.jobId}`}
                  className="block w-full rounded-md bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
                >
                  View converted job →
                </Link>
              ) : (
                <form action={convertQuoteToJob.bind(null, quoteId)}>
                  <button
                    type="submit"
                    disabled={quote.lines.length === 0}
                    className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Convert to job
                  </button>
                </form>
              )}
            </div>
          </Card>

          <Card title="Details">
            <div className="space-y-2 text-sm">
              <Row label="Customer reference" value={quote.customerReference ?? "—"} />
              <Row label="Issue date" value={formatDate(quote.issueDate)} />
              <Row label="Validity / expiry" value={formatDate(quote.expiryDate)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className={bold ? "text-lg font-bold text-slate-900 dark:text-slate-50" : "font-semibold"}>{value}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-slate-700 dark:text-slate-300">{value}</span>
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <p className="mt-1 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">{text}</p>
    </div>
  );
}
