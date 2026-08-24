import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { JobStatusBadge, TrafficBadge } from "@/components/Badge";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import { getReportsData, getSalesAndPurchasingStats } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [data, salesPurchasing] = await Promise.all([getReportsData(), getSalesAndPurchasingStats()]);
  const rankedJobs = [...data.jobs]
    .filter((jf) => jf.job.status !== "LEAD" && jf.job.status !== "LOST")
    .sort((a, b) => b.forecast.forecastMarginPercent - a.forecast.forecastMarginPercent);

  const pl = data.profitLoss;

  return (
    <div>
      <PageHeader title="Reports" description="Job profitability, a simplified management P&L, employee productivity, sales pipeline and purchasing." />

      <div className="space-y-5">
        <Card title="Job profitability — most to least profitable">
          <Table>
            <THead>
              <Th>Job</Th>
              <Th>Status</Th>
              <Th>Revenue</Th>
              <Th>Labour</Th>
              <Th>Materials</Th>
              <Th>Subs</Th>
              <Th>Total cost</Th>
              <Th>Gross profit</Th>
              <Th>Margin</Th>
            </THead>
            <tbody>
              {rankedJobs.map((jf) => (
                <Tr key={jf.job.id}>
                  <Td className="font-medium">
                    <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                      {jf.job.jobNumber}
                    </Link>
                  </Td>
                  <Td>
                    <JobStatusBadge status={jf.job.status} />
                  </Td>
                  <Td>{formatCurrency(jf.job.quoteAmount)}</Td>
                  <Td>{formatCurrency(jf.actual.labour)}</Td>
                  <Td>{formatCurrency(jf.actual.materials)}</Td>
                  <Td>{formatCurrency(jf.actual.subcontractor)}</Td>
                  <Td>{formatCurrency(jf.forecast.forecastFinalCost)}</Td>
                  <Td>{formatCurrency(jf.forecast.forecastProfit)}</Td>
                  <Td>
                    <TrafficBadge severity={jf.belowTargetMargin ? "red" : "green"} label={formatPercent(jf.forecast.forecastMarginPercent, 1)} />
                  </Td>
                </Tr>
              ))}
              {rankedJobs.length === 0 && <EmptyRow colSpan={9}>No jobs to report on yet.</EmptyRow>}
            </tbody>
          </Table>
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
              <Row label="Business overheads (recorded expenses)" value={`(${formatCurrency(pl.overheads)})`} sub />
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Operating profit" value={formatCurrency(pl.operatingProfit)} bold />
              <Row label="Net operating margin" value={formatPercent(pl.netOperatingMarginPercent, 1)} sub />
            </div>
            <Link href="/expenses" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Manage expenses →
            </Link>
          </Card>

          <Card title="Employee productivity (last 4 payroll weeks recorded)">
            <Table>
              <THead>
                <Th>Employee</Th>
                <Th>Paid hrs</Th>
                <Th>Billable</Th>
                <Th>Utilisation</Th>
                <Th>GP contribution</Th>
              </THead>
              <tbody>
                {data.employeeProductivity.map((row) => (
                  <Tr key={row.id}>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.name} />
                        {row.name}
                      </div>
                    </Td>
                    <Td>{formatHours(row.paidHours)}</Td>
                    <Td>{formatHours(row.billableHours)}</Td>
                    <Td>{formatPercent(row.utilisationPercent)}</Td>
                    <Td>{formatCurrency(row.grossProfitContribution)}</Td>
                  </Tr>
                ))}
                {data.employeeProductivity.length === 0 && <EmptyRow colSpan={5}>No payroll history recorded yet.</EmptyRow>}
              </tbody>
            </Table>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card title="Sales pipeline">
            <div className="space-y-1.5 text-sm">
              <Row label="Enquiries received" value={String(salesPurchasing.enquiries.total)} />
              <Row label="Converted to jobs" value={String(salesPurchasing.enquiries.converted)} sub />
              <Row label="Lost / no response" value={String(salesPurchasing.enquiries.lost)} sub />
              <Row label="Enquiry conversion rate" value={formatPercent(salesPurchasing.enquiries.conversionRatePercent, 1)} bold />
              <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
              <Row label="Quotes issued" value={String(salesPurchasing.quotes.total)} />
              <Row label="Accepted" value={String(salesPurchasing.quotes.accepted)} sub />
              <Row label="Declined / expired" value={String(salesPurchasing.quotes.declined)} sub />
              <Row label="Quote win rate" value={formatPercent(salesPurchasing.quotes.conversionRatePercent, 1)} bold />
              <Row label="Average quote value" value={formatCurrency(salesPurchasing.quotes.avgValue)} sub />
            </div>
            <div className="mt-4 flex gap-4 text-sm font-medium">
              <Link href="/enquiries" className="text-blue-600 hover:underline">
                Enquiries →
              </Link>
              <Link href="/quotes" className="text-blue-600 hover:underline">
                Quotes →
              </Link>
            </div>
          </Card>

          <Card title="Purchasing">
            <div className="space-y-1.5 text-sm">
              <Row label="Committed (open POs)" value={formatCurrency(salesPurchasing.purchasing.totalCommitted)} bold />
              <Row label="Open purchase orders" value={String(salesPurchasing.purchasing.openPoCount)} sub />
            </div>
            {salesPurchasing.purchasing.spendBySupplier.length > 0 && (
              <div className="mt-4">
                <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Spend by supplier</div>
                <div className="space-y-1 text-sm">
                  {salesPurchasing.purchasing.spendBySupplier.slice(0, 6).map((s) => (
                    <Row key={s.supplierName} label={s.supplierName} value={formatCurrency(s.total)} />
                  ))}
                </div>
              </div>
            )}
            <Link href="/purchase-orders" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
              Purchase orders →
            </Link>
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
