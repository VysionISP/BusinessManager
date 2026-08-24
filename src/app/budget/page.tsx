import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getBudgetVsActual } from "@/lib/queries";

export const dynamic = "force-dynamic";

const MONTH_FORMATTER = new Intl.DateTimeFormat("en-AU", { month: "long", year: "numeric" });

function parseMonth(month: string | undefined): Date {
  if (month) {
    const [y, m] = month.split("-").map(Number);
    if (y && m) return new Date(y, m - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function monthParam(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

export default async function BudgetPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const { month } = await searchParams;
  const monthStart = parseMonth(month);
  const data = await getBudgetVsActual(monthStart);

  return (
    <div>
      <PageHeader
        title="Budget vs actual"
        description="Budget comes straight from the Overheads register and modelled payroll — actual comes from recorded Expenses and real payroll. No separate budget to maintain."
        actions={
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/budget?month=${monthParam(addMonths(monthStart, -1))}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              ← Prev month
            </Link>
            <span className="px-2 font-medium">{MONTH_FORMATTER.format(monthStart)}</span>
            <Link href={`/budget?month=${monthParam(addMonths(monthStart, 1))}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Next month →
            </Link>
          </div>
        }
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Budget</th>
                <th className="py-2 pr-4">Actual</th>
                <th className="py-2 pr-4">Variance</th>
                <th className="py-2 pr-4">% over/under</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => {
                const over = row.budget > 0 && row.variance > 0;
                return (
                  <tr key={row.key} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium">{row.label}</td>
                    <td className="py-2 pr-4">{formatCurrency(row.budget)}</td>
                    <td className="py-2 pr-4">{formatCurrency(row.actual)}</td>
                    <td className="py-2 pr-4">
                      <TrafficBadge severity={over ? "red" : "green"} label={`${row.variance >= 0 ? "+" : ""}${formatCurrency(row.variance)}`} />
                    </td>
                    <td className="py-2 pr-4">{row.budget > 0 ? formatPercent(row.percentVariance, 1) : "—"}</td>
                  </tr>
                );
              })}
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">
                    No overheads or expenses recorded for this month yet.
                  </td>
                </tr>
              )}
            </tbody>
            {data.rows.length > 0 && (
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-semibold dark:border-slate-700">
                  <td className="py-2 pr-4">Total</td>
                  <td className="py-2 pr-4">{formatCurrency(data.totalBudget)}</td>
                  <td className="py-2 pr-4">{formatCurrency(data.totalActual)}</td>
                  <td className="py-2 pr-4" colSpan={2}>
                    {formatCurrency(data.totalActual - data.totalBudget)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </Card>
    </div>
  );
}
