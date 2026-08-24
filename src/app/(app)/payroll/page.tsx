import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/FormField";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { payrollEntryCost, weeklyPayrollSummary } from "@/lib/calculations";
import { addDays, formatWeekLabel, mondayOfWeek } from "@/lib/dates";
import { formatCurrency, toDateInputValue } from "@/lib/format";
import { getEmployees } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { savePayrollWeek } from "./actions";

export const dynamic = "force-dynamic";

function parseWeek(week: string | undefined): Date {
  if (week) {
    const d = new Date(week);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return mondayOfWeek(0);
}

export default async function PayrollPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const weekStart = parseWeek(week);
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const employees = await getEmployees(true);
  const entries = await prisma.payrollEntry.findMany({ where: { weekCommencing: weekStart } });
  const entryByEmployee = new Map(entries.map((e) => [e.employeeId, e]));

  const rows = employees.map((e) => {
    const existing = entryByEmployee.get(e.id);
    return {
      employee: e,
      entry: existing ?? {
        ordinaryHours: e.ordinaryHoursPerWeek,
        overtimeHours: e.overtimeHoursPerWeek,
        allowances: e.weeklyAllowances,
        leaveHours: 0,
        sickHours: 0,
        nonBillableHours: 0,
        billableHours: e.expectedBillableHoursPerWeek,
      },
    };
  });

  const summary = weeklyPayrollSummary(
    employees,
    rows.map((r, i) => ({ employeeIndex: i, entry: r.entry })),
  );

  const boundSave = savePayrollWeek.bind(null, toDateInputValue(weekStart), employees.map((e) => e.id));

  return (
    <div>
      <PageHeader
        title="Weekly payroll"
        description="Enter each employee's actual hours for the week to calculate gross wages, super, on-costs and total payroll cost."
        actions={
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/payroll?week=${toDateInputValue(prevWeek)}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              ← Prev week
            </Link>
            <span className="px-2 font-medium">{formatWeekLabel(weekStart)}</span>
            <Link href={`/payroll?week=${toDateInputValue(nextWeek)}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Next week →
            </Link>
          </div>
        }
      />

      <form action={boundSave}>
        <Card>
          <Table>
            <THead>
              <Th>Employee</Th>
              <Th>Ordinary</Th>
              <Th>Overtime</Th>
              <Th>Allowances $</Th>
              <Th>Leave</Th>
              <Th>Sick</Th>
              <Th>Non-billable</Th>
              <Th>Billable</Th>
              <Th>Total cost</Th>
            </THead>
            <tbody>
              {rows.map(({ employee, entry }) => {
                const cost = payrollEntryCost(employee, entry);
                const inputClass =
                  "w-20 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800";
                return (
                  <Tr key={employee.id}>
                    <Td className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={employee.name} />
                        {employee.name}
                      </div>
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`ordinaryHours_${employee.id}`} defaultValue={entry.ordinaryHours} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`overtimeHours_${employee.id}`} defaultValue={entry.overtimeHours} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.01" name={`allowances_${employee.id}`} defaultValue={entry.allowances} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`leaveHours_${employee.id}`} defaultValue={entry.leaveHours} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`sickHours_${employee.id}`} defaultValue={entry.sickHours} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`nonBillableHours_${employee.id}`} defaultValue={entry.nonBillableHours} className={inputClass} />
                    </Td>
                    <Td>
                      <input type="number" step="0.5" name={`billableHours_${employee.id}`} defaultValue={entry.billableHours} className={inputClass} />
                    </Td>
                    <Td className="font-medium">{formatCurrency(cost.totalCost)}</Td>
                  </Tr>
                );
              })}
              {rows.length === 0 && <EmptyRow colSpan={9}>No active employees.</EmptyRow>}
            </tbody>
          </Table>
          <div className="mt-4">
            <Button>Save week</Button>
          </div>
        </Card>
      </form>

      <div className="mt-5">
        <Card title="Weekly summary">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Wages</div>
              <div className="text-lg font-semibold">{formatCurrency(summary.wages)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Super</div>
              <div className="text-lg font-semibold">{formatCurrency(summary.super)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Other on-costs</div>
              <div className="text-lg font-semibold">{formatCurrency(summary.onCosts)}</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Total payroll cost</div>
              <div className="text-lg font-semibold text-indigo-600">{formatCurrency(summary.totalPayrollCost)}</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
