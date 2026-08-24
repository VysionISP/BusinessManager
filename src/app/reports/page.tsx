import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { JobStatusBadge, TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import { getReportsData } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const data = await getReportsData();
  const rankedJobs = [...data.jobs]
    .filter((jf) => jf.job.status !== "LEAD" && jf.job.status !== "LOST")
    .sort((a, b) => b.forecast.forecastMarginPercent - a.forecast.forecastMarginPercent);

  const pl = data.profitLoss;

  return (
    <div>
      <PageHeader title="Reports" description="Job profitability, a simplified management P&L, and employee productivity." />

      <div className="space-y-5">
        <Card title="Job profitability — most to least profitable">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="py-2 pr-4">Job</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Revenue</th>
                  <th className="py-2 pr-4">Labour</th>
                  <th className="py-2 pr-4">Materials</th>
                  <th className="py-2 pr-4">Subs</th>
                  <th className="py-2 pr-4">Total cost</th>
                  <th className="py-2 pr-4">Gross profit</th>
                  <th className="py-2 pr-4">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rankedJobs.map((jf) => (
                  <tr key={jf.job.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                    <td className="py-2 pr-4 font-medium">
                      <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                        {jf.job.jobNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <JobStatusBadge status={jf.job.status} />
                    </td>
                    <td className="py-2 pr-4">{formatCurrency(jf.job.quoteAmount)}</td>
                    <td className="py-2 pr-4">{formatCurrency(jf.actual.labour)}</td>
                    <td className="py-2 pr-4">{formatCurrency(jf.actual.materials)}</td>
                    <td className="py-2 pr-4">{formatCurrency(jf.actual.subcontractor)}</td>
                    <td className="py-2 pr-4">{formatCurrency(jf.forecast.forecastFinalCost)}</td>
                    <td className="py-2 pr-4">{formatCurrency(jf.forecast.forecastProfit)}</td>
                    <td className="py-2 pr-4">
                      <TrafficBadge severity={jf.belowTargetMargin ? "red" : "green"} label={formatPercent(jf.forecast.forecastMarginPercent, 1)} />
                    </td>
                  </tr>
                ))}
                {rankedJobs.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-center text-slate-400">
                      No jobs to report on yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Management P&L (active, complete & invoiced jobs)">
            <div className="space-y-1.5 text-sm">
              <Row label="Revenue" value={formatCurrency(pl.revenue)} />
              <Row label="Labour" value={`(${formatCurrency(pl.labour)})`} sub />
              <Row label="Materials" value={`(${formatCurrency(pl.materials)})`} sub />
              <Row label="Subcontractors" value={`(${formatCurrency(pl.subcontractors)})`} sub />
              <Row label="Other direct costs" value={`(${formatCurrency(pl.otherDirect)})`} sub />
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Gross profit" value={formatCurrency(pl.grossProfit)} bold />
              <Row label="Gross profit margin" value={formatPercent(pl.grossProfitMarginPercent, 1)} sub />
              <Row label="Business overheads (monthly)" value={`(${formatCurrency(pl.overheads)})`} sub />
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Operating profit" value={formatCurrency(pl.operatingProfit)} bold />
              <Row label="Net operating margin" value={formatPercent(pl.netOperatingMarginPercent, 1)} sub />
            </div>
          </Card>

          <Card title="Employee productivity (last 4 payroll weeks recorded)">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-3">Employee</th>
                    <th className="py-2 pr-3">Paid hrs</th>
                    <th className="py-2 pr-3">Billable</th>
                    <th className="py-2 pr-3">Utilisation</th>
                    <th className="py-2 pr-3">GP contribution</th>
                  </tr>
                </thead>
                <tbody>
                  {data.employeeProductivity.map((row) => (
                    <tr key={row.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 pr-3 font-medium">{row.name}</td>
                      <td className="py-2 pr-3">{formatHours(row.paidHours)}</td>
                      <td className="py-2 pr-3">{formatHours(row.billableHours)}</td>
                      <td className="py-2 pr-3">{formatPercent(row.utilisationPercent)}</td>
                      <td className="py-2 pr-3">{formatCurrency(row.grossProfitContribution)}</td>
                    </tr>
                  ))}
                  {data.employeeProductivity.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        No payroll history recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, sub }: { label: string; value: string; bold?: boolean; sub?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={sub ? "pl-3 text-xs text-slate-400" : "text-slate-600 dark:text-slate-300"}>{label}</span>
      <span className={bold ? "font-semibold text-slate-900 dark:text-slate-50" : sub ? "text-xs text-slate-400" : "text-slate-700 dark:text-slate-300"}>
        {value}
      </span>
    </div>
  );
}
