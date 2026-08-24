import type { AlertSeverity } from "@/lib/calculations";
import { TrafficDot } from "./Badge";

export function StatTile({
  label,
  value,
  sublabel,
  severity,
}: {
  label: string;
  value: string;
  sublabel?: string;
  severity?: AlertSeverity;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
        {severity && <TrafficDot severity={severity} />}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">{value}</div>
      {sublabel && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sublabel}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
