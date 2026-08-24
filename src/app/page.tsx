import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatGrid, StatTile } from "@/components/StatTile";
import { TrafficBadge } from "@/components/Badge";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";
import type { AlertSeverity } from "@/lib/calculations";

export const dynamic = "force-dynamic";

function buildAlerts(data: Awaited<ReturnType<typeof getDashboardData>>) {
  const alerts: { severity: AlertSeverity; message: string; href?: string }[] = [];

  if (data.jobsBelowMargin.length > 0) {
    alerts.push({
      severity: "red",
      message: `${data.jobsBelowMargin.length} active job${data.jobsBelowMargin.length > 1 ? "s" : ""} forecasting below target margin (${formatPercent(data.settings.targetMarginPercent)}).`,
      href: "/jobs",
    });
  }
  if (data.jobsOverBudget.length > 0) {
    alerts.push({
      severity: "orange",
      message: `${data.jobsOverBudget.length} active job${data.jobsOverBudget.length > 1 ? "s" : ""} over budget on labour hours or materials.`,
      href: "/jobs",
    });
  }
  if (data.overdueInvoiceTotal > 0) {
    alerts.push({ severity: "red", message: `${formatCurrency(data.overdueInvoiceTotal)} of invoices are overdue.`, href: "/jobs" });
  }
  if (data.cashTiedUpInJobs > data.totalActiveJobValue * 0.2 && data.totalActiveJobValue > 0) {
    alerts.push({
      severity: "orange",
      message: `${formatCurrency(data.cashTiedUpInJobs)} of business cash is currently funding active jobs.`,
      href: "/jobs",
    });
  }
  if (data.forecastBankBalance4Weeks < 0) {
    alerts.push({ severity: "red", message: `Forecast bank balance goes negative within 4 weeks.`, href: "/cashflow" });
  }
  if (data.labour.utilisationPercent < data.settings.targetUtilisationPercent) {
    alerts.push({
      severity: "orange",
      message: `Labour utilisation is ${formatPercent(data.labour.utilisationPercent)}, below the ${formatPercent(data.settings.targetUtilisationPercent)} target.`,
      href: "/reports",
    });
  }
  if (data.labour.avgChargeOutRate < data.breakEvenRate) {
    alerts.push({
      severity: "red",
      message: `Average charge-out rate (${formatCurrency(data.labour.avgChargeOutRate, true)}/hr) is below the break-even rate (${formatCurrency(data.breakEvenRate, true)}/hr).`,
      href: "/break-even",
    });
  }

  return alerts;
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const alerts = buildAlerts(data);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Your Monday-morning view: what the business costs to run, what jobs are actually making, and how much cash is on hand."
      />

      {alerts.length > 0 && (
        <div className="mb-6 space-y-2">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                alert.severity === "red"
                  ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                  : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
              }`}
            >
              <span>{alert.message}</span>
              {alert.href && (
                <Link href={alert.href} className="shrink-0 font-medium underline underline-offset-2">
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Business running costs">
          <StatGrid>
            <StatTile label="Weekly wages" value={formatCurrency(data.runningCosts.weeklyWages)} />
            <StatTile label="Weekly super" value={formatCurrency(data.runningCosts.weeklySuper)} />
            <StatTile label="Weekly on-costs" value={formatCurrency(data.runningCosts.weeklyOnCosts)} />
            <StatTile label="Weekly overheads" value={formatCurrency(data.runningCosts.weeklyOverheads)} />
          </StatGrid>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <StatTile label="Total weekly cost" value={formatCurrency(data.runningCosts.totalWeeklyCost)} severity="orange" />
            <StatTile label="Monthly cost" value={formatCurrency(data.runningCosts.monthlyCost)} />
            <StatTile label="Annual cost" value={formatCurrency(data.runningCosts.annualCost)} />
          </div>
        </Card>

        <Card title="Labour">
          <StatGrid>
            <StatTile label="Employees" value={String(data.labour.employeeCount)} />
            <StatTile label="Available hours" value={formatHours(data.labour.totalAvailableHours)} />
            <StatTile label="Billable hours" value={formatHours(data.labour.totalBillableHours)} />
            <StatTile
              label="Utilisation"
              value={formatPercent(data.labour.utilisationPercent)}
              severity={data.severities.utilisation}
            />
            <StatTile label="Avg cost / hour" value={formatCurrency(data.labour.avgCostPerHour, true)} />
            <StatTile label="Break-even / hour" value={formatCurrency(data.breakEvenRate, true)} />
            <StatTile
              label="Avg charge-out rate"
              value={formatCurrency(data.labour.avgChargeOutRate, true)}
              severity={data.severities.chargeOutVsBreakEven}
            />
            <StatTile label="Target rate" value={formatCurrency(data.targetRate, true)} />
          </StatGrid>
        </Card>

        <Card title="Jobs">
          <StatGrid>
            <StatTile label="Active job value" value={formatCurrency(data.totalActiveJobValue)} />
            <StatTile label="Est. profit (active)" value={formatCurrency(data.estimatedActiveProfit)} />
            <StatTile label="Avg margin" value={formatPercent(data.avgActiveMarginPercent)} severity={data.severities.jobMargin} />
            <StatTile label="Work in progress" value={formatCurrency(data.totalWip)} sublabel="Earned but not yet invoiced" />
            <StatTile
              label="Over budget"
              value={String(data.jobsOverBudget.length)}
              severity={data.jobsOverBudget.length === 0 ? "green" : "orange"}
            />
            <StatTile
              label="Below target margin"
              value={String(data.jobsBelowMargin.length)}
              severity={data.jobsBelowMargin.length === 0 ? "green" : "red"}
            />
          </StatGrid>
          <Link href="/jobs" className="mt-4 inline-block text-sm font-medium text-blue-600 hover:underline">
            View all jobs →
          </Link>
        </Card>

        <Card title="Cash">
          <StatGrid>
            <StatTile label="Bank balance" value={formatCurrency(data.currentBankBalance)} severity={data.severities.bankBalance} />
            <StatTile label="Expected in (4 wks)" value={formatCurrency(data.cashExpectedIn4Weeks)} />
            <StatTile
              label="Outstanding invoices"
              value={formatCurrency(data.outstandingInvoices)}
              severity={data.severities.overdueInvoices}
              sublabel={data.overdueInvoiceTotal > 0 ? `${formatCurrency(data.overdueInvoiceTotal)} overdue` : undefined}
            />
            <StatTile label="Wages due" value={formatCurrency(data.wagesDue)} sublabel="This week" />
            <StatTile label="Super due" value={formatCurrency(data.superDue)} sublabel="This week" />
            <StatTile label="Bills due" value={formatCurrency(data.billsDue)} sublabel="This week" />
            <StatTile
              label="Cash tied up in jobs"
              value={formatCurrency(data.cashTiedUpInJobs)}
              severity={data.severities.cashTiedUp}
            />
            <StatTile
              label="Forecast balance (4 wks)"
              value={formatCurrency(data.forecastBankBalance4Weeks)}
              severity={data.severities.bankBalance}
            />
          </StatGrid>
          <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800/40 dark:text-slate-300">
            Revenue needed over the next 4 weeks to cover running costs at a {formatPercent(data.settings.targetMarginPercent)} margin:{" "}
            <strong className="text-slate-900 dark:text-slate-50">{formatCurrency(data.revenueNeededNext4Weeks)}</strong>
          </div>
          <Link href="/cashflow" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
            View 13-week cashflow →
          </Link>
        </Card>
      </div>

      {(data.jobsBelowMargin.length > 0 || data.jobsOverBudget.length > 0) && (
        <div className="mt-5">
          <Card title="Jobs needing attention">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:text-slate-400">
                    <th className="py-2 pr-4">Job</th>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Forecast margin</th>
                    <th className="py-2 pr-4">Cash position</th>
                    <th className="py-2 pr-4">Issue</th>
                  </tr>
                </thead>
                <tbody>
                  {[...new Map([...data.jobsBelowMargin, ...data.jobsOverBudget].map((jf) => [jf.job.id, jf])).values()].map((jf) => (
                    <tr key={jf.job.id} className="border-b border-slate-50 last:border-0 dark:border-slate-800/60">
                      <td className="py-2 pr-4 font-medium">
                        <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                          {jf.job.jobNumber}
                        </Link>
                      </td>
                      <td className="py-2 pr-4">{jf.job.customerName}</td>
                      <td className="py-2 pr-4">
                        <TrafficBadge
                          severity={jf.belowTargetMargin ? "red" : "green"}
                          label={formatPercent(jf.forecast.forecastMarginPercent, 1)}
                        />
                      </td>
                      <td className="py-2 pr-4">
                        <TrafficBadge severity={jf.heavyCashFunding ? "red" : "green"} label={formatCurrency(jf.cash.cashPosition)} />
                      </td>
                      <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                        {[
                          jf.belowTargetMargin && "Below target margin",
                          jf.overBudgetLabourHours && "Over budget on hours",
                          jf.overBudgetMaterials && "Over budget on materials",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
