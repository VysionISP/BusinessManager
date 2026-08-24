import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate } from "@/lib/format";
import { quoteTotals } from "@/lib/calculations";
import { QUOTE_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";
import { createBlankTemplate } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_SEVERITY: Record<string, "green" | "orange" | "red"> = {
  DRAFT: "orange",
  SENT: "orange",
  ACCEPTED: "green",
  DECLINED: "red",
  EXPIRED: "red",
};

export default async function QuotesPage() {
  const [quotes, templates] = await Promise.all([
    prisma.quote.findMany({
      where: { isTemplate: false },
      include: { customer: true, lines: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.quote.findMany({
      where: { isTemplate: true },
      include: { lines: true },
      orderBy: { title: "asc" },
    }),
  ]);

  // Only show the latest version of each quote number in the main list.
  const latestByNumber = new Map<string, (typeof quotes)[number]>();
  for (const q of quotes) {
    const existing = latestByNumber.get(q.quoteNumber);
    if (!existing || q.version > existing.version) latestByNumber.set(q.quoteNumber, q);
  }
  const latest = [...latestByNumber.values()].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  return (
    <div>
      <PageHeader
        title="Quotes"
        description="Formal, versioned quotes with line items. Once accepted, convert straight into a job."
        actions={
          <Link href="/quotes/new">
            <Button>New quote</Button>
          </Link>
        }
      />

      <Card>
        <Table>
          <THead>
            <Th>Quote #</Th>
            <Th>Title</Th>
            <Th>Customer</Th>
            <Th>Issue date</Th>
            <Th>Value</Th>
            <Th>Status</Th>
          </THead>
          <tbody>
            {latest.map((q) => {
              const totals = quoteTotals(q.lines);
              return (
                <Tr key={q.id}>
                  <Td className="font-medium">
                    <Link href={`/quotes/${q.id}`} className="text-indigo-600 hover:underline">
                      {q.quoteNumber}
                      {q.version > 1 && <span className="text-slate-400"> v{q.version}</span>}
                    </Link>
                  </Td>
                  <Td>{q.title}</Td>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <Avatar name={q.customer?.name ?? "?"} />
                      {q.customer?.name ?? "—"}
                    </div>
                  </Td>
                  <Td>{formatDate(q.issueDate)}</Td>
                  <Td>{formatCurrency(totals.totalSell)}</Td>
                  <Td>
                    <TrafficBadge severity={STATUS_SEVERITY[q.status] ?? "orange"} label={QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS] ?? q.status} />
                  </Td>
                </Tr>
              );
            })}
            {latest.length === 0 && <EmptyRow colSpan={6}>No quotes yet.</EmptyRow>}
          </tbody>
        </Table>
      </Card>

      <div className="mt-6">
        <Card
          title="Quote templates"
          action={
            <form action={createBlankTemplate}>
              <button type="submit" className="text-sm font-medium text-indigo-600 hover:underline">
                + New template
              </button>
            </form>
          }
        >
          {templates.length === 0 ? (
            <p className="text-sm text-slate-400">
              No templates yet. Build one from scratch with &ldquo;New template&rdquo;, or open any quote and use
              &ldquo;Save as template&rdquo; to reuse its sections, lines and terms.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => {
                const totals = quoteTotals(t.lines);
                return (
                  <div key={t.id} className="rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold">{t.title}</div>
                        <div className="text-xs text-slate-400">
                          {t.quoteNumber} · {t.lines.length} line{t.lines.length === 1 ? "" : "s"} · {formatCurrency(totals.totalSell)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs">
                      <Link href={`/quotes/${t.id}`} className="font-medium text-indigo-600 hover:underline">
                        Edit template
                      </Link>
                      <Link href={`/quotes/${t.id}#use-template`} className="font-medium text-emerald-600 hover:underline">
                        New quote from this →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
