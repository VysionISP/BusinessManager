import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatDate } from "@/lib/format";
import { prisma } from "@/lib/db";
import { ENQUIRY_STATUSES, ENQUIRY_STATUS_LABELS } from "@/lib/types";

export const dynamic = "force-dynamic";

const URGENCY_CLASSES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  NORMAL: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  EMERGENCY: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export default async function EnquiriesPage() {
  const enquiries = await prisma.enquiry.findMany({
    include: { customer: true },
    orderBy: { createdAt: "desc" },
  });

  const columns = ENQUIRY_STATUSES.filter((s) => s !== "CONVERTED" && s !== "LOST" && s !== "NO_RESPONSE");
  const closedOut = enquiries.filter((e) => e.status === "CONVERTED" || e.status === "LOST" || e.status === "NO_RESPONSE");

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Every opportunity before it becomes a job. Move an enquiry through to Ready to quote, then convert it into a job."
        actions={
          <Link href="/enquiries/new">
            <Button>New enquiry</Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {columns.map((status) => {
          const items = enquiries.filter((e) => e.status === status);
          return (
            <div key={status} className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                {ENQUIRY_STATUS_LABELS[status]} <span className="text-slate-400">({items.length})</span>
              </div>
              <div className="space-y-2 p-2">
                {items.map((e) => (
                  <Link
                    key={e.id}
                    href={`/enquiries/${e.id}`}
                    className="block rounded-lg border border-slate-100 p-2.5 text-sm hover:border-indigo-300 hover:bg-indigo-50/50 dark:border-slate-800 dark:hover:bg-slate-800/60"
                  >
                    <div className="font-medium text-slate-800 dark:text-slate-200">{e.customer?.name ?? e.contactName ?? "New enquiry"}</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{e.workRequested}</div>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className={`rounded-full px-2 py-0.5 ${URGENCY_CLASSES[e.urgency] ?? URGENCY_CLASSES.NORMAL}`}>{e.urgency}</span>
                      {e.estimatedValue != null && <span className="text-slate-400">{formatCurrency(e.estimatedValue)}</span>}
                    </div>
                    {e.followUpDate && <div className="mt-1 text-xs text-slate-400">Follow up {formatDate(e.followUpDate)}</div>}
                  </Link>
                ))}
                {items.length === 0 && <p className="px-1 py-2 text-xs text-slate-400">Nothing here.</p>}
              </div>
            </div>
          );
        })}
      </div>

      {closedOut.length > 0 && (
        <div className="mt-5">
          <Card title="Converted / lost / no response">
            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Customer</Th>
                <Th>Work requested</Th>
                <Th>Outcome</Th>
              </THead>
              <tbody>
                {closedOut.map((e) => (
                  <Tr key={e.id}>
                    <Td>{formatDate(e.createdAt)}</Td>
                    <Td>
                      <Link href={`/enquiries/${e.id}`} className="text-indigo-600 hover:underline">
                        {e.customer?.name ?? e.contactName ?? "—"}
                      </Link>
                    </Td>
                    <Td>{e.workRequested}</Td>
                    <Td>{ENQUIRY_STATUS_LABELS[e.status as keyof typeof ENQUIRY_STATUS_LABELS] ?? e.status}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
}
