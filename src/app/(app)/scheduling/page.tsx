import Link from "next/link";
import { Card } from "@/components/Card";
import { PageHeader } from "@/components/PageHeader";
import { TrafficBadge } from "@/components/Badge";
import { addDays, mondayOfWeek } from "@/lib/dates";
import { toDateInputValue } from "@/lib/format";
import { getEmployees, getJobsForSelection } from "@/lib/queries";
import { SCHEDULE_EVENT_TYPE_LABELS } from "@/lib/types";
import { prisma } from "@/lib/db";
import { Table, THead, Th, Tr, Td, EmptyRow, Avatar } from "@/components/Table";
import { ScheduleEventForm } from "./ScheduleEventForm";
import { createScheduleEvent, deleteScheduleEvent } from "./actions";

export const dynamic = "force-dynamic";

const DAY_FORMATTER = new Intl.DateTimeFormat("en-AU", { weekday: "short", day: "2-digit", month: "short" });
const TIME_FORMATTER = new Intl.DateTimeFormat("en-AU", { hour: "2-digit", minute: "2-digit" });

function parseWeek(week: string | undefined): Date {
  if (week) {
    const d = new Date(week);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return mondayOfWeek(0);
}

export default async function SchedulingPage({ searchParams }: { searchParams: Promise<{ week?: string }> }) {
  const { week } = await searchParams;
  const weekStart = parseWeek(week);
  const weekEnd = addDays(weekStart, 7);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const [employees, jobs, events, unscheduledJobs] = await Promise.all([
    getEmployees(true),
    getJobsForSelection(),
    prisma.scheduleEvent.findMany({
      where: { startAt: { gte: weekStart, lt: weekEnd } },
      include: { job: true, employee: true, site: true },
      orderBy: { startAt: "asc" },
    }),
    prisma.job.findMany({
      where: { status: { in: ["APPROVED", "PENDING"] }, scheduleEvents: { none: {} } },
      select: { id: true, jobNumber: true, description: true, customer: { select: { name: true } } },
      take: 10,
    }),
  ]);

  const jobOptions = jobs.map((j) => ({
    id: j.id,
    jobNumber: j.jobNumber,
    customerName: j.customer.name,
    siteId: null,
    phases: j.phases,
  }));

  return (
    <div>
      <PageHeader
        title="Scheduling"
        description="Who's where, when. Quote visits are uncharged quoting activity — actual field work should be scheduled against a job (and phase, if it has one) so labour lines up with job costing."
        actions={
          <div className="flex items-center gap-2 text-sm">
            <Link href={`/scheduling?week=${toDateInputValue(addDays(weekStart, -7))}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              ← Prev week
            </Link>
            <span className="px-2 font-medium">
              {DAY_FORMATTER.format(weekStart)} – {DAY_FORMATTER.format(addDays(weekStart, 6))}
            </span>
            <Link href={`/scheduling?week=${toDateInputValue(addDays(weekStart, 7))}`} className="rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
              Next week →
            </Link>
          </div>
        }
      />

      <Card title="Schedule an event">
        <ScheduleEventForm action={createScheduleEvent} jobs={jobOptions} employees={employees} />
      </Card>

      <div className="mt-5">
        <Card>
          <Table>
            <THead>
              <Th className="w-32">Employee</Th>
              {days.map((d) => (
                <Th key={d.toISOString()}>{DAY_FORMATTER.format(d)}</Th>
              ))}
            </THead>
            <tbody>
              {employees.map((emp) => (
                <Tr key={emp.id} className="align-top">
                  <Td className="w-32 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={emp.name} />
                      {emp.name}
                    </div>
                  </Td>
                  {days.map((d) => {
                    const dayEnd = addDays(d, 1);
                    const dayEvents = events.filter((e) => e.employeeId === emp.id && e.startAt >= d && e.startAt < dayEnd);
                    return (
                      <Td key={d.toISOString()} className="align-top">
                        <div className="space-y-1">
                          {dayEvents.map((e) => (
                            <div key={e.id} className="rounded-md border border-slate-100 p-1.5 text-xs dark:border-slate-800">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-medium">
                                  {TIME_FORMATTER.format(e.startAt)}–{TIME_FORMATTER.format(e.endAt)}
                                </span>
                                <form action={deleteScheduleEvent.bind(null, e.id)}>
                                  <button type="submit" className="text-rose-500 hover:underline">
                                    ×
                                  </button>
                                </form>
                              </div>
                              <div className="text-slate-600 dark:text-slate-300">{e.title}</div>
                              {e.job && (
                                <Link href={`/jobs/${e.job.id}`} className="text-indigo-600 hover:underline">
                                  {e.job.jobNumber}
                                </Link>
                              )}
                              <div className="text-slate-400">{SCHEDULE_EVENT_TYPE_LABELS[e.eventType as keyof typeof SCHEDULE_EVENT_TYPE_LABELS] ?? e.eventType}</div>
                            </div>
                          ))}
                        </div>
                      </Td>
                    );
                  })}
                </Tr>
              ))}
              {employees.length === 0 && <EmptyRow colSpan={8}>No active employees.</EmptyRow>}
            </tbody>
          </Table>
        </Card>
      </div>

      {unscheduledJobs.length > 0 && (
        <div className="mt-5">
          <Card title="Approved jobs not yet scheduled">
            <div className="flex flex-wrap gap-2">
              {unscheduledJobs.map((j) => (
                <Link key={j.id} href={`/jobs/${j.id}`}>
                  <TrafficBadge severity="orange" label={`${j.jobNumber} — ${j.customer.name}`} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
