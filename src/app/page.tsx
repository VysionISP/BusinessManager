import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { StatGrid, StatTile } from "@/components/StatTile";
import { TrafficBadge } from "@/components/Badge";
import { Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatHours, formatPercent } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";
import type { AlertSeverity } from "@/lib/calculations";
import {
  AlertOctagon,
  AlertTriangle,
  Banknote,
  Briefcase,
  CalendarDays,
  CalendarRange,
  Clock,
  Coins,
  DollarSign,
  FileText,
  FileWarning,
  Gauge,
  HardHat,
  Inbox,
  Landmark,
  LineChart,
  Percent,
  PiggyBank,
  Receipt,
  Scale,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

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
  if (data.enquiriesNeedingFollowUp > 0) {
    alerts.push({
      severity: "orange",
      message: `${data.enquiriesNeedingFollowUp} enquir${data.enquiriesNeedingFollowUp > 1 ? "ies" : "y"} due for follow-up.`,
      href: "/enquiries",
    });
  }
  if (data.stalledQuotes > 0) {
    alerts.push({
      severity: "orange",
      message: `${data.stalledQuotes} quote${data.stalledQuotes > 1 ? "s" : ""} still in draft more than 2 days after creation.`,
      href: "/quotes",
    });
  }
  if (data.posAwaitingApproval > 0) {
    alerts.push({
      severity: "orange",
      message: `${data.posAwaitingApproval} purchase order${data.posAwaitingApproval > 1 ? "s" : ""} waiting on approval.`,
      href: "/purchase-orders",
    });
  }
  if (data.variationsAwaitingApproval > 0) {
    alerts.push({
      severity: "orange",
      message: `${data.variationsAwaitingApproval} variation${data.variationsAwaitingApproval > 1 ? "s" : ""} awaiting a decision.`,
      href: "/jobs",
    });
  }
  if (data.assetsOverdue > 0) {
    alerts.push({
      severity: "red",
      message: `${data.assetsOverdue} customer asset${data.assetsOverdue > 1 ? "s are" : " is"} overdue for service.`,
      href: "/assets",
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
          {alerts.map((alert, i) => {
            const AlertIcon = alert.severity === "red" ? AlertOctagon : AlertTriangle;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm shadow-sm ${
                  alert.severity === "red"
                    ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300"
                    : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    alert.severity === "red"
                      ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300"
                      : "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-300"
                  }`}
                >
                  <AlertIcon className="h-4 w-4" strokeWidth={2.25} />
                </span>
                <span className="flex-1">{alert.message}</span>
                {alert.href && (
                  <Link href={alert.href} className="shrink-0 font-semibold underline underline-offset-2">
                    View
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Business running costs" icon={Wallet}>
          <StatGrid>
            <StatTile label="Weekly wages" value={formatCurrency(data.runningCosts.weeklyWages)} icon={Banknote} />
            <StatTile label="Weekly super" value={formatCurrency(data.runningCosts.weeklySuper)} icon={PiggyBank} />
            <StatTile label="Weekly on-costs" value={formatCurrency(data.runningCosts.weeklyOnCosts)} icon={Receipt} />
            <StatTile label="Weekly overheads" value={formatCurrency(data.runningCosts.weeklyOverheads)} icon={FileText} />
          </StatGrid>
          <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
            <StatTile label="Total weekly cost" value={formatCurrency(data.runningCosts.totalWeeklyCost)} severity="orange" icon={Wallet} />
            <StatTile label="Monthly cost" value={formatCurrency(data.runningCosts.monthlyCost)} icon={CalendarDays} />
            <StatTile label="Annual cost" value={formatCurrency(data.runningCosts.annualCost)} icon={CalendarRange} />
          </div>
        </Card>

        <Card title="Labour" icon={Users}>
          <StatGrid>
            <StatTile label="Employees" value={String(data.labour.employeeCount)} icon={Users} />
            <StatTile label="Available hours" value={formatHours(data.labour.totalAvailableHours)} icon={Clock} />
            <StatTile label="Billable hours" value={formatHours(data.labour.totalBillableHours)} icon={Timer} />
            <StatTile
              label="Utilisation"
              value={formatPercent(data.labour.utilisationPercent)}
              severity={data.severities.utilisation}
              icon={Gauge}
            />
            <StatTile label="Avg cost / hour" value={formatCurrency(data.labour.avgCostPerHour, true)} icon={DollarSign} />
            <StatTile label="Break-even / hour" value={formatCurrency(data.breakEvenRate, true)} icon={Scale} />
            <StatTile
              label="Avg charge-out rate"
              value={formatCurrency(data.labour.avgChargeOutRate, true)}
              severity={data.severities.chargeOutVsBreakEven}
              icon={TrendingUp}
            />
            <StatTile label="Target rate" value={formatCurrency(data.targetRate, true)} icon={Target} />
          </StatGrid>
        </Card>

        <Card title="Jobs" icon={Briefcase}>
          <StatGrid>
            <StatTile label="Open enquiries" value={String(data.openEnquiries)} sublabel="Sales pipeline" icon={Inbox} />
            <StatTile label="Quotes awaiting action" value={String(data.quotesAwaitingAction)} icon={FileText} />
            <StatTile label="Active job value" value={formatCurrency(data.totalActiveJobValue)} icon={Briefcase} />
            <StatTile label="Est. profit (active)" value={formatCurrency(data.estimatedActiveProfit)} icon={TrendingUp} />
            <StatTile
              label="Avg margin"
              value={formatPercent(data.avgActiveMarginPercent)}
              severity={data.severities.jobMargin}
              icon={Percent}
            />
            <StatTile
              label="Work in progress"
              value={formatCurrency(data.totalWip)}
              sublabel="Earned but not yet invoiced"
              icon={HardHat}
            />
            <StatTile
              label="Over budget"
              value={String(data.jobsOverBudget.length)}
              severity={data.jobsOverBudget.length === 0 ? "green" : "orange"}
              icon={AlertTriangle}
            />
            <StatTile
              label="Below target margin"
              value={String(data.jobsBelowMargin.length)}
              severity={data.jobsBelowMargin.length === 0 ? "green" : "red"}
              icon={TrendingDown}
            />
          </StatGrid>
          <div className="mt-4 flex flex-wrap gap-4 text-sm font-medium">
            <Link href="/enquiries" className="text-blue-600 hover:underline">
              Enquiries →
            </Link>
            <Link href="/quotes" className="text-blue-600 hover:underline">
              Quotes →
            </Link>
            <Link href="/jobs" className="text-blue-600 hover:underline">
              All jobs →
            </Link>
          </div>
        </Card>

        <Card title="Cash" icon={Landmark}>
          <StatGrid>
            <StatTile
              label="Bank balance"
              value={formatCurrency(data.currentBankBalance)}
              severity={data.severities.bankBalance}
              icon={Landmark}
            />
            <StatTile label="Expected in (4 wks)" value={formatCurrency(data.cashExpectedIn4Weeks)} icon={TrendingUp} />
            <StatTile
              label="Outstanding invoices"
              value={formatCurrency(data.outstandingInvoices)}
              severity={data.severities.overdueInvoices}
              sublabel={data.overdueInvoiceTotal > 0 ? `${formatCurrency(data.overdueInvoiceTotal)} overdue` : undefined}
              icon={FileWarning}
            />
            <StatTile label="Wages due" value={formatCurrency(data.wagesDue)} sublabel="This week" icon={Banknote} />
            <StatTile label="Super due" value={formatCurrency(data.superDue)} sublabel="This week" icon={PiggyBank} />
            <StatTile label="Bills due" value={formatCurrency(data.billsDue)} sublabel="This week" icon={Receipt} />
            <StatTile
              label="Cash tied up in jobs"
              value={formatCurrency(data.cashTiedUpInJobs)}
              severity={data.severities.cashTiedUp}
              icon={Coins}
            />
            <StatTile
              label="Forecast balance (4 wks)"
              value={formatCurrency(data.forecastBankBalance4Weeks)}
              severity={data.severities.bankBalance}
              icon={LineChart}
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
          <Card title="Jobs needing attention" icon={AlertTriangle}>
            <Table>
              <THead>
                <Th>Job</Th>
                <Th>Customer</Th>
                <Th>Forecast margin</Th>
                <Th>Cash position</Th>
                <Th>Issue</Th>
              </THead>
              <tbody>
                {[...new Map([...data.jobsBelowMargin, ...data.jobsOverBudget].map((jf) => [jf.job.id, jf])).values()].map((jf) => (
                  <Tr key={jf.job.id}>
                    <Td className="font-medium">
                      <Link href={`/jobs/${jf.job.id}`} className="text-blue-600 hover:underline">
                        {jf.job.jobNumber}
                      </Link>
                    </Td>
                    <Td>{jf.job.customer.name}</Td>
                    <Td>
                      <TrafficBadge
                        severity={jf.belowTargetMargin ? "red" : "green"}
                        label={formatPercent(jf.forecast.forecastMarginPercent, 1)}
                      />
                    </Td>
                    <Td>
                      <TrafficBadge severity={jf.heavyCashFunding ? "red" : "green"} label={formatCurrency(jf.cash.cashPosition)} />
                    </Td>
                    <Td className="text-slate-500 dark:text-slate-400">
                      {[
                        jf.belowTargetMargin && "Below target margin",
                        jf.overBudgetLabourHours && "Over budget on hours",
                        jf.overBudgetMaterials && "Over budget on materials",
                      ]
                        .filter(Boolean)
                        .join(", ")}
                    </Td>
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
