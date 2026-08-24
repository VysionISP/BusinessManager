import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { StatTile } from "@/components/StatTile";
import { TrafficBadge } from "@/components/Badge";
import { Table, Td, Th, THead, Tr } from "@/components/Table";
import { formatCurrency, formatPercent } from "@/lib/format";
import { getDashboardData } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { addDays, startOfDay } from "@/lib/dates";
import { SCHEDULE_EVENT_TYPE_LABELS } from "@/lib/types";
import type { AlertSeverity } from "@/lib/calculations";
import { AlertOctagon, AlertTriangle, Briefcase, CalendarDays, FileWarning, Gauge, Inbox, Landmark, Percent, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

const TIME_FORMATTER = new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit" });

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
  const today = startOfDay();
  const [data, todaysSchedule] = await Promise.all([
    getDashboardData(),
    prisma.scheduleEvent.findMany({
      where: { startAt: { gte: today, lt: addDays(today, 1) } },
      include: { employee: true, job: true },
      orderBy: { startAt: "asc" },
    }),
  ]);
  const alerts = buildAlerts(data);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Today at a glance — what's on, what needs attention, and where the business stands."
        actions={
          <div className="flex items-center gap-2">
            <Link href="/enquiries/new">
              <Button variant="secondary">New enquiry</Button>
            </Link>
            <Link href="/quotes/new">
              <Button variant="secondary">New quote</Button>
            </Link>
            <Link href="/jobs/new">
              <Button>New job</Button>
            </Link>
          </div>
        }
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatTile label="Active job value" value={formatCurrency(data.totalActiveJobValue)} icon={Briefcase} />
        <StatTile label="Est. profit (active)" value={formatCurrency(data.estimatedActiveProfit)} icon={TrendingUp} />
        <StatTile label="Avg margin" value={formatPercent(data.avgActiveMarginPercent)} severity={data.severities.jobMargin} icon={Percent} />
        <StatTile
          label="Outstanding invoices"
          value={formatCurrency(data.outstandingInvoices)}
          severity={data.severities.overdueInvoices}
          sublabel={data.overdueInvoiceTotal > 0 ? `${formatCurrency(data.overdueInvoiceTotal)} overdue` : undefined}
          icon={FileWarning}
        />
        <StatTile label="Bank balance" value={formatCurrency(data.currentBankBalance)} severity={data.severities.bankBalance} icon={Landmark} />
        <StatTile label="Utilisation" value={formatPercent(data.labour.utilisationPercent)} severity={data.severities.utilisation} icon={Gauge} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Today's schedule" icon={CalendarDays}>
            {todaysSchedule.length > 0 ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {todaysSchedule.map((e) => (
                  <li key={e.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="w-24 shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                      {TIME_FORMATTER.format(e.startAt)}–{TIME_FORMATTER.format(e.endAt)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
                        {e.title}
                        {e.job && (
                          <>
                            {" · "}
                            <Link href={`/jobs/${e.job.id}`} className="text-blue-600 hover:underline">
                              {e.job.jobNumber}
                            </Link>
                          </>
                        )}
                      </div>
                      <div className="truncate text-xs text-slate-400">
                        {e.employee?.name ?? "Unassigned"} · {SCHEDULE_EVENT_TYPE_LABELS[e.eventType as keyof typeof SCHEDULE_EVENT_TYPE_LABELS] ?? e.eventType}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">Nothing scheduled for today.</p>
            )}
            <Link href="/scheduling" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
              Open scheduling →
            </Link>
          </Card>
        </div>

        <div>
          <Card title="Sales pipeline" icon={Inbox}>
            <div className="space-y-3">
              <Link
                href="/enquiries"
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">Open enquiries</span>
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">{data.openEnquiries}</span>
              </Link>
              <Link
                href="/quotes"
                className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60"
              >
                <span className="text-sm text-slate-600 dark:text-slate-300">Quotes awaiting action</span>
                <span className="text-lg font-semibold text-slate-900 dark:text-slate-50">{data.quotesAwaitingAction}</span>
              </Link>
            </div>
          </Card>
        </div>
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
