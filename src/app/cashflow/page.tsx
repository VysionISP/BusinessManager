import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatWeekLabel } from "@/lib/dates";
import { getCashflowForecast } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { CASHFLOW_DIRECTIONS } from "@/lib/types";
import { addCashflowAdjustment, deleteCashflowAdjustment } from "./actions";

export const dynamic = "force-dynamic";

export default async function CashflowPage({ searchParams }: { searchParams: Promise<{ weeks?: string }> }) {
  const { weeks } = await searchParams;
  const horizon = weeks === "52" ? 52 : 13;

  const [forecast, adjustments] = await Promise.all([
    getCashflowForecast(horizon),
    prisma.cashflowAdjustment.findMany({ orderBy: { weekStarting: "asc" } }),
  ]);

  const negativeWeeks = forecast.filter((w) => w.isNegative);

  return (
    <div>
      <PageHeader
        title="Cashflow forecast"
        description="Opening balance + cash received − cash paid = closing balance. Recurring payroll, super and overheads roll forward automatically; add one-off items below."
        actions={
          <div className="flex gap-2 text-sm">
            <Link href="/cashflow?weeks=13" className={`rounded-md px-3 py-1.5 ${horizon === 13 ? "bg-blue-600 text-white" : "border border-slate-300 dark:border-slate-700"}`}>
              13 weeks
            </Link>
            <Link href="/cashflow?weeks=52" className={`rounded-md px-3 py-1.5 ${horizon === 52 ? "bg-blue-600 text-white" : "border border-slate-300 dark:border-slate-700"}`}>
              52 weeks
            </Link>
          </div>
        }
      />

      {negativeWeeks.length > 0 && (
        <div className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          Forecast bank balance goes negative in {negativeWeeks.length} week{negativeWeeks.length > 1 ? "s" : ""}, starting{" "}
          {formatWeekLabel(negativeWeeks[0].weekStarting)}.
        </div>
      )}

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                <th className="py-2 pr-4">Week</th>
                <th className="py-2 pr-4">Opening</th>
                <th className="py-2 pr-4">Cash in</th>
                <th className="py-2 pr-4">Wages</th>
                <th className="py-2 pr-4">Super</th>
                <th className="py-2 pr-4">Overheads</th>
                <th className="py-2 pr-4">Other out</th>
                <th className="py-2 pr-4">Closing</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((w, i) => (
                <tr
                  key={i}
                  className={`border-b border-slate-50 last:border-0 dark:border-slate-800/60 ${w.isNegative ? "bg-rose-50 dark:bg-rose-950/20" : ""}`}
                >
                  <td className="py-2 pr-4 font-medium">{formatWeekLabel(w.weekStarting)}</td>
                  <td className="py-2 pr-4">{formatCurrency(w.openingBalance)}</td>
                  <td className="py-2 pr-4 text-emerald-600">{formatCurrency(w.cashIn.total)}</td>
                  <td className="py-2 pr-4">{formatCurrency(w.cashOut.wages)}</td>
                  <td className="py-2 pr-4">{formatCurrency(w.cashOut.super)}</td>
                  <td className="py-2 pr-4">{formatCurrency(w.cashOut.overheads)}</td>
                  <td className="py-2 pr-4">{formatCurrency(w.cashOut.other)}</td>
                  <td className={`py-2 pr-4 font-semibold ${w.isNegative ? "text-rose-600" : "text-slate-900 dark:text-slate-50"}`}>
                    {formatCurrency(w.closingBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-5">
        <Card title="One-off cash items">
          <form action={addCashflowAdjustment} className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-6 sm:items-end">
            <FormField label="Week starting" name="weekStarting" type="date" required />
            <FormField label="Direction" name="direction" defaultValue="OUT" options={CASHFLOW_DIRECTIONS.map((d) => ({ value: d, label: d === "IN" ? "Cash in" : "Cash out" }))} />
            <FormField label="Category" name="category" defaultValue="Other" hint="e.g. Tax, Equipment, Vehicles" />
            <div className="col-span-2">
              <FormField label="Description" name="description" required />
            </div>
            <FormField label="Amount ($)" name="amount" type="number" step="0.01" required />
            <button type="submit" className="col-span-2 rounded-md bg-slate-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 sm:col-span-1">
              Add
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Week</th>
                  <th className="py-2 pr-4">Direction</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4">Description</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4" />
                </tr>
              </thead>
              <tbody>
                {adjustments.map((a) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4">{formatDate(a.weekStarting)}</td>
                    <td className={`py-2 pr-4 ${a.direction === "IN" ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}`}>
                      {a.direction === "IN" ? "Cash in" : "Cash out"}
                    </td>
                    <td className="py-2 pr-4">{a.category}</td>
                    <td className="py-2 pr-4">{a.description}</td>
                    <td className="py-2 pr-4">{formatCurrency(a.amount)}</td>
                    <td className="py-2 pr-4 text-right">
                      <form action={deleteCashflowAdjustment.bind(null, a.id)}>
                        <button type="submit" className="text-xs text-rose-600 hover:underline">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
                {adjustments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-slate-400">
                      No one-off items recorded.
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
