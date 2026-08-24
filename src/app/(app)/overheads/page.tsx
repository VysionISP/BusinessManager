import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Table, Td, Th, THead, Tr } from "@/components/Table";
import { overheadAnnualEquivalent, overheadMonthlyEquivalent, overheadWeeklyEquivalent, totalWeeklyOverheads } from "@/lib/calculations";
import { formatCurrency } from "@/lib/format";
import { getOverheads } from "@/lib/queries";
import { OVERHEAD_CATEGORIES, OVERHEAD_CATEGORY_LABELS } from "@/lib/types";
import { deleteOverhead } from "./actions";

export const dynamic = "force-dynamic";

const FREQUENCY_LABELS: Record<string, string> = {
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUAL: "Annual",
};

export default async function OverheadsPage() {
  const overheads = await getOverheads();
  const totalWeekly = totalWeeklyOverheads(overheads.filter((o) => o.active));

  return (
    <div>
      <PageHeader
        title="Business overheads"
        description="Every expense is converted to weekly, monthly and annual equivalents so it can be built into the break-even rate."
        actions={
          <Link href="/overheads/new">
            <Button>Add expense</Button>
          </Link>
        }
      />

      <div className="space-y-5">
        {OVERHEAD_CATEGORIES.map((category) => {
          const items = overheads.filter((o) => o.category === category);
          if (items.length === 0) return null;
          return (
            <Card key={category} title={OVERHEAD_CATEGORY_LABELS[category]}>
              <Table>
                <THead>
                  <Th>Expense</Th>
                  <Th>Amount</Th>
                  <Th>Frequency</Th>
                  <Th>Weekly</Th>
                  <Th>Monthly</Th>
                  <Th>Annual</Th>
                  <Th>Status</Th>
                  <Th />
                </THead>
                <tbody>
                  {items.map((o) => (
                    <Tr key={o.id}>
                      <Td className="font-medium">{o.name}</Td>
                      <Td>{formatCurrency(o.amount, true)}</Td>
                      <Td className="text-slate-500 dark:text-slate-400">{FREQUENCY_LABELS[o.frequency]}</Td>
                      <Td>{formatCurrency(overheadWeeklyEquivalent(o), true)}</Td>
                      <Td>{formatCurrency(overheadMonthlyEquivalent(o), true)}</Td>
                      <Td>{formatCurrency(overheadAnnualEquivalent(o), true)}</Td>
                      <Td>{o.active ? <span className="text-emerald-600">Active</span> : <span className="text-slate-400">Inactive</span>}</Td>
                      <Td className="text-right">
                        <div className="flex justify-end gap-3">
                          <Link href={`/overheads/${o.id}/edit`} className="text-blue-600 hover:underline">
                            Edit
                          </Link>
                          <form
                            action={async () => {
                              "use server";
                              await deleteOverhead(o.id);
                            }}
                          >
                            <button type="submit" className="text-rose-600 hover:underline">
                              Delete
                            </button>
                          </form>
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </Card>
          );
        })}
        {overheads.length === 0 && (
          <Card>
            <p className="py-6 text-center text-slate-400">No overhead expenses recorded yet.</p>
          </Card>
        )}
      </div>

      <div className="mt-5 rounded-lg border border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-900">
        <span className="text-sm text-slate-500 dark:text-slate-400">Total weekly overheads (active only)</span>
        <div className="text-2xl font-semibold text-blue-600">{formatCurrency(totalWeekly)}</div>
      </div>
    </div>
  );
}
