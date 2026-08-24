import type { AlertSeverity } from "@/lib/calculations";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types";

const TRAFFIC_CLASSES: Record<AlertSeverity, string> = {
  green: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  orange: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
};

const TRAFFIC_DOT: Record<AlertSeverity, string> = {
  green: "bg-emerald-500",
  orange: "bg-amber-500",
  red: "bg-rose-500",
};

export function TrafficBadge({ severity, label }: { severity: AlertSeverity; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TRAFFIC_CLASSES[severity]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${TRAFFIC_DOT[severity]}`} />
      {label}
    </span>
  );
}

export function TrafficDot({ severity }: { severity: AlertSeverity }) {
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${TRAFFIC_DOT[severity]}`} />;
}

const JOB_STATUS_CLASSES: Record<JobStatus, string> = {
  LEAD: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  QUOTED: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  APPROVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETE: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  INVOICED: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  PAID: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  LOST: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
};

export function JobStatusBadge({ status }: { status: string }) {
  const key = (status in JOB_STATUS_LABELS ? status : "LEAD") as JobStatus;
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${JOB_STATUS_CLASSES[key]}`}>
      {JOB_STATUS_LABELS[key]}
    </span>
  );
}
