import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatDate } from "@/lib/format";
import { quoteTotals } from "@/lib/calculations";
import { QUOTE_STATUS_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const STATUS_SEVERITY: Record<string, "green" | "orange" | "red"> = {
  DRAFT: "orange",
  SENT: "orange",
  ACCEPTED: "green",
  DECLINED: "red",
  EXPIRED: "red",
};

export default async function QuotesPage() {
  const quotes = await prisma.quote.findMany({
    include: { customer: true, lines: true },
    orderBy: { createdAt: "desc" },
  });

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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Quote #</th>
                <th className="py-2 pr-4">Title</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Issue date</th>
                <th className="py-2 pr-4">Value</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {latest.map((q) => {
                const totals = quoteTotals(q.lines);
                return (
                  <tr key={q.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium">
                      <Link href={`/quotes/${q.id}`} className="text-blue-600 hover:underline">
                        {q.quoteNumber}
                        {q.version > 1 && <span className="text-slate-400"> v{q.version}</span>}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">{q.title}</td>
                    <td className="py-2 pr-4">{q.customer.name}</td>
                    <td className="py-2 pr-4">{formatDate(q.issueDate)}</td>
                    <td className="py-2 pr-4">{formatCurrency(totals.totalSell)}</td>
                    <td className="py-2 pr-4">
                      <TrafficBadge severity={STATUS_SEVERITY[q.status] ?? "orange"} label={QUOTE_STATUS_LABELS[q.status as keyof typeof QUOTE_STATUS_LABELS] ?? q.status} />
                    </td>
                  </tr>
                );
              })}
              {latest.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-400">
                    No quotes yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
