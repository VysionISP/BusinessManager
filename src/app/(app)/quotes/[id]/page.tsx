import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button, FormField } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { quoteLineSell, quoteTotals } from "@/lib/calculations";
import { QUOTE_STATUSES, QUOTE_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";
import { QuoteLineForm } from "../QuoteLineForm";
import { addQuoteLine, convertQuoteToJob, createNewVersion, deleteQuote, deleteQuoteLine, setQuoteStatus } from "../actions";

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
    include: { customer: true, site: true, lines: { orderBy: { sortOrder: "asc" } }, job: true },
  });
  if (!quote) notFound();

  const totals = quoteTotals(quote.lines);
  const boundAddLine = addQuoteLine.bind(null, quoteId);
  const boundSetStatus = setQuoteStatus.bind(null, quoteId);

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

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card title="Line items">
            <div className="mb-4">
              <QuoteLineForm action={boundAddLine} />
            </div>
            <Table>
              <THead>
                <Th>Section</Th>
                <Th>Description</Th>
                <Th>Qty</Th>
                <Th>Unit price</Th>
                <Th>Line total</Th>
                <Th />
              </THead>
              <tbody>
                {quote.lines.map((line) => (
                  <Tr key={line.id}>
                    <Td className="text-slate-500 dark:text-slate-400">{line.section ?? "—"}</Td>
                    <Td>{line.description}</Td>
                    <Td>
                      {line.quantity} {line.unit}
                    </Td>
                    <Td>{formatCurrency(line.unitPrice, true)}</Td>
                    <Td className="font-medium">{formatCurrency(quoteLineSell(line))}</Td>
                    <Td className="text-right">
                      <form action={deleteQuoteLine.bind(null, quoteId, line.id)}>
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </Td>
                  </Tr>
                ))}
                {quote.lines.length === 0 && <EmptyRow colSpan={6}>No line items yet.</EmptyRow>}
              </tbody>
            </Table>

            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 dark:border-slate-800 sm:grid-cols-4">
              <Stat label="Total cost" value={formatCurrency(totals.totalCost)} />
              <Stat label="Total price" value={formatCurrency(totals.totalSell)} />
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
              <FormField label="Status" name="status" defaultValue={quote.status} options={QUOTE_STATUSES.map((s) => ({ value: s, label: QUOTE_STATUS_LABELS[s] }))} />
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
                  Create new version
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
              <Row label="Expiry date" value={formatDate(quote.expiryDate)} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="font-semibold">{value}</div>
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
