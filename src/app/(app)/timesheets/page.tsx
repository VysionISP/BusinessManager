import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { Avatar, EmptyRow, Table, Td, Th, THead, Tr } from "@/components/Table";
import { timesheetWeekRollup } from "@/lib/calculations";
import { addDays, formatWeekLabel, mondayOfWeek } from "@/lib/dates";
import { formatCurrency, formatDate, toDateInputValue } from "@/lib/format";
import { getEmployees } from "@/lib/queries";
import { prisma } from "@/lib/db";
import { ACTIVE_JOB_STATUSES, TIMESHEET_KIND_LABELS, type TimesheetKind } from "@/lib/types";
import { TimesheetEntryForm } from "./TimesheetEntryForm";
import { addTimesheetEntry, deleteTimesheetEntry, updateTimesheetEntry } from "./actions";

export const dynamic = "force-dynamic";

function parseWeek(week: string | undefined): Date {
  if (week) {
    const d = new Date(week);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return mondayOfWeek(0);
}

export default async function TimesheetsPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const weekStart = parseWeek(week);
  const weekEnd = addDays(weekStart, 7);
  const prevWeek = addDays(weekStart, -7);
  const nextWeek = addDays(weekStart, 7);

  const [employees, entries, jobs] = await Promise.all([
    getEmployees(true),
    prisma.timesheetEntry.findMany({
      where: { date: { gte: weekStart, lt: weekEnd } },
      include: { job: { select: { id: true, jobNumber: true, description: true } }, costEntry: { select: { id: true, amount: true, invoiceId: true } } },
      orderBy: [{ date: "asc" }, { id: "asc" }],
    }),
    prisma.job.findMany({
      where: { status: { in: [...ACTIVE_JOB_STATUSES] } },
      select: { id: true, jobNumber: true, description: true },
      orderBy: { jobNumber: "asc" },
    }),
  ]);

  const entriesByEmployee = new Map<number, typeof entries>();
  for (const e of entries) {
    const list = entriesByEmployee.get(e.employeeId) ?? [];
    list.push(e);
    entriesByEmployee.set(e.employeeId, list);
  }

  const cards = employees.map((employee) => {
    const empEntries = entriesByEmployee.get(employee.id) ?? [];
    const rollup = timesheetWeekRollup(empEntries);
    const postedCost = empEntries.reduce((sum, e) => sum + (e.costEntry?.amount ?? 0), 0);
    const totalHours = rollup.ordinaryHours + rollup.overtimeHours + rollup.leaveHours + rollup.sickHours;
    return { employee, empEntries, rollup, postedCost, totalHours };
  });
  const businessHours = cards.reduce((sum, c) => sum + c.totalHours, 0);
  const businessLabourCost = cards.reduce((sum, c) => sum + c.postedCost, 0);

  return (
    <div>
      <PageHeader
        title="Timesheets"
        description="Daily hours per person, entered once: they roll up into weekly payroll, and hours on a job post that job's true labour cost automatically."
        actions={
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/timesheets?week=${toDateInputValue(prevWeek)}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              ← Prev week
            </Link>
            <span className="px-2 font-medium">{formatWeekLabel(weekStart)}</span>
            <Link href={`/timesheets?week=${toDateInputValue(nextWeek)}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Next week →
            </Link>
          </div>
        }
      />

      <div className="mb-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Hours this week</div>
          <div className="text-lg font-bold">{businessHours}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Labour cost posted to jobs</div>
          <div className="text-lg font-bold">{formatCurrency(businessLabourCost)}</div>
        </Card>
        <Card>
          <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Payroll</div>
          <Link href={`/payroll?week=${toDateInputValue(weekStart)}`} className="text-sm font-medium text-indigo-600 hover:underline">
            Fill payroll from these timesheets →
          </Link>
        </Card>
      </div>

      <div className="space-y-5">
        {cards.map(({ employee, empEntries, rollup, postedCost, totalHours }) => (
          <Card key={employee.id}>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Avatar name={employee.name} />
                <div>
                  <div className="font-semibold">{employee.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{employee.role}</div>
                </div>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {totalHours} hrs · {rollup.billableHours} billable · {rollup.overtimeHours} OT · {formatCurrency(postedCost)} posted to jobs
              </div>
            </div>

            <Table>
              <THead>
                <Th>Date</Th>
                <Th>Type</Th>
                <Th>Job</Th>
                <Th>Hours</Th>
                <Th>Billable</Th>
                <Th>Cost posted</Th>
                <Th>Notes</Th>
                <Th />
              </THead>
              <tbody>
                {empEntries.map((e) => {
                  const locked = e.costEntry?.invoiceId != null;
                  return (
                    <Tr key={e.id}>
                      <Td>{formatDate(e.date)}</Td>
                      <Td>{TIMESHEET_KIND_LABELS[e.kind as TimesheetKind] ?? e.kind}</Td>
                      <Td>
                        {e.job ? (
                          <Link href={`/jobs/${e.job.id}`} className="text-indigo-600 hover:underline">
                            {e.job.jobNumber}
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </Td>
                      <Td>{e.hours}</Td>
                      <Td>{e.kind === "ORDINARY" || e.kind === "OVERTIME" ? (e.billable ? "Yes" : "No") : "—"}</Td>
                      <Td>{e.costEntry ? formatCurrency(e.costEntry.amount) : "—"}</Td>
                      <Td className="max-w-48 truncate text-slate-500 dark:text-slate-400">{e.notes ?? ""}</Td>
                      <Td>
                        {locked ? (
                          <span className="text-xs text-slate-400" title="This time has been billed on an invoice and can no longer be changed">
                            Billed
                          </span>
                        ) : (
                          <div className="flex items-center gap-3 text-xs">
                            <details>
                              <summary className="cursor-pointer font-medium text-indigo-600">Edit</summary>
                              <div className="mt-2 w-[36rem] max-w-[80vw]">
                                <TimesheetEntryForm entry={e} jobs={jobs} action={updateTimesheetEntry.bind(null, e.id)} submitLabel="Save entry" />
                              </div>
                            </details>
                            <form action={deleteTimesheetEntry.bind(null, e.id)}>
                              <button type="submit" className="text-rose-600 hover:underline">
                                Delete
                              </button>
                            </form>
                          </div>
                        )}
                      </Td>
                    </Tr>
                  );
                })}
                {empEntries.length === 0 && <EmptyRow colSpan={8}>No time entered this week.</EmptyRow>}
              </tbody>
            </Table>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-indigo-600">+ Add time</summary>
              <div className="mt-3">
                <TimesheetEntryForm defaultDate={weekStart} jobs={jobs} action={addTimesheetEntry.bind(null, employee.id)} />
              </div>
            </details>
          </Card>
        ))}
        {cards.length === 0 && (
          <Card>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No active employees yet —{" "}
              <Link href="/employees/new" className="text-indigo-600 hover:underline">
                add your first employee
              </Link>{" "}
              to start entering time.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
