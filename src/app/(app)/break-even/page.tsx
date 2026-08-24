import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { breakEvenHourlyRate, businessRunningCosts, labourStats } from "@/lib/calculations";
import { formatCurrency, formatHours } from "@/lib/format";
import { getEmployees, getOverheads, getSettings } from "@/lib/queries";
import { MarginCalculator } from "./MarginCalculator";

export const dynamic = "force-dynamic";

export default async function BreakEvenPage() {
  const [employees, overheads, settings] = await Promise.all([getEmployees(true), getOverheads(true), getSettings()]);

  const runningCosts = businessRunningCosts(employees, overheads);
  const labour = labourStats(employees, overheads);
  const breakEvenRate = breakEvenHourlyRate(runningCosts.totalWeeklyCost, labour.totalBillableHours);

  return (
    <div>
      <PageHeader
        title="Break-even calculator"
        description="Total weekly running cost ÷ total billable hours = the rate every billable hour must recover just to cover costs."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Total weekly running cost">
          <div className="space-y-2 text-sm">
            <Row label="Weekly payroll (wages + super + on-costs)" value={formatCurrency(runningCosts.weeklyWages + runningCosts.weeklySuper + runningCosts.weeklyOnCosts)} />
            <Row label="Weekly overheads" value={formatCurrency(runningCosts.weeklyOverheads)} />
            <div className="my-2 border-t border-slate-100 dark:border-slate-800" />
            <Row label="Total weekly running cost" value={formatCurrency(runningCosts.totalWeeklyCost)} bold />
          </div>
        </Card>

        <Card title="Billable hours">
          <div className="space-y-2 text-sm">
            <Row label="Total available hours / week" value={formatHours(labour.totalAvailableHours)} />
            <Row label="Total billable hours / week" value={formatHours(labour.totalBillableHours)} bold />
            <Row label="Utilisation" value={`${labour.utilisationPercent.toFixed(0)}%`} />
          </div>
        </Card>
      </div>

      <div className="mt-5">
        <Card title="Break-even & target rate">
          <div className="mb-4 rounded-lg bg-slate-900 px-5 py-4 text-white dark:bg-slate-800">
            <div className="text-sm text-slate-300">
              {formatCurrency(runningCosts.totalWeeklyCost)} ÷ {formatHours(labour.totalBillableHours)} ={" "}
            </div>
            <div className="text-2xl font-semibold">{formatCurrency(breakEvenRate, true)} per billable hour</div>
          </div>
          <MarginCalculator breakEvenRate={breakEvenRate} defaultMargin={settings.targetMarginPercent} />
          <p className="mt-4 text-xs text-slate-400">
            Margin ≠ markup. A price is calculated as cost ÷ (1 − margin), so a 20% margin means 20% of the final price is profit — not 20% added on
            top of cost. Change the business default in <Link href="/settings" className="underline">Settings</Link>.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className={bold ? "font-semibold text-slate-900 dark:text-slate-50" : "text-slate-700 dark:text-slate-300"}>{value}</span>
    </div>
  );
}
