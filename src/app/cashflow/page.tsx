import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { FormField } from "@/components/FormField";
import { EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
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
        <Table>
          <THead>
            <Th>Week</Th>
            <Th>Opening</Th>
            <Th>Cash in</Th>
            <Th>Wages</Th>
            <Th>Super</Th>
            <Th>Overheads</Th>
            <Th>Other out</Th>
            <Th>Closing</Th>
          </THead>
          <tbody>
            {forecast.map((w, i) => (
              <Tr key={i} className={w.isNegative ? "bg-rose-50 dark:bg-rose-950/20" : ""}>
                <Td className="font-medium">{formatWeekLabel(w.weekStarting)}</Td>
                <Td>{formatCurrency(w.openingBalance)}</Td>
                <Td className="text-emerald-600">{formatCurrency(w.cashIn.total)}</Td>
                <Td>{formatCurrency(w.cashOut.wages)}</Td>
                <Td>{formatCurrency(w.cashOut.super)}</Td>
                <Td>{formatCurrency(w.cashOut.overheads)}</Td>
                <Td>{formatCurrency(w.cashOut.other)}</Td>
                <Td className={`font-semibold ${w.isNegative ? "text-rose-600" : "text-slate-900 dark:text-slate-50"}`}>
                  {formatCurrency(w.closingBalance)}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
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

          <Table>
            <THead>
              <Th>Week</Th>
              <Th>Direction</Th>
              <Th>Category</Th>
              <Th>Description</Th>
              <Th>Amount</Th>
              <Th />
            </THead>
            <tbody>
              {adjustments.map((a) => (
                <Tr key={a.id}>
                  <Td>{formatDate(a.weekStarting)}</Td>
                  <Td className={a.direction === "IN" ? "text-emerald-600" : "text-slate-600 dark:text-slate-300"}>
                    {a.direction === "IN" ? "Cash in" : "Cash out"}
                  </Td>
                  <Td>{a.category}</Td>
                  <Td>{a.description}</Td>
                  <Td>{formatCurrency(a.amount)}</Td>
                  <Td className="text-right">
                    <form action={deleteCashflowAdjustment.bind(null, a.id)}>
                      <button type="submit" className="text-xs text-rose-600 hover:underline">
                        Delete
                      </button>
                    </form>
                  </Td>
                </Tr>
              ))}
              {adjustments.length === 0 && <EmptyRow colSpan={6}>No one-off items recorded.</EmptyRow>}
            </tbody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
