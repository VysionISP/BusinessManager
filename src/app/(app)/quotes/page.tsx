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
                      <Avatar name={q.customer.name} />
                      {q.customer.name}
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
    </div>
  );
}
