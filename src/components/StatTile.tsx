import type { AlertSeverity } from "@/lib/calculations";
import type { LucideIcon } from "lucide-react";

const ACCENT_CLASSES: Record<AlertSeverity, { bar: string; iconBg: string; iconText: string }> = {
  green: {
    bar: "from-emerald-400 to-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconText: "text-emerald-600 dark:text-emerald-400",
  },
  orange: {
    bar: "from-amber-400 to-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-500/10",
    iconText: "text-amber-600 dark:text-amber-400",
  },
  red: {
    bar: "from-rose-400 to-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-500/10",
    iconText: "text-rose-600 dark:text-rose-400",
  },
};

const NEUTRAL = {
  bar: "from-indigo-400 to-violet-500",
  iconBg: "bg-indigo-50 dark:bg-indigo-500/10",
  iconText: "text-indigo-600 dark:text-indigo-400",
};

export function StatTile({
  label,
  value,
  sublabel,
  severity,
  icon: Icon,
}: {
  label: string;
  value: string;
  sublabel?: string;
  severity?: AlertSeverity;
  icon?: LucideIcon;
}) {
  const accent = severity ? ACCENT_CLASSES[severity] : NEUTRAL;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-sm shadow-slate-200/50 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-200/70 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none dark:hover:shadow-none">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent.bar}`} />
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div className="mt-3 text-[1.7rem] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
      {sublabel && <div className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">{sublabel}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}

const METRIC_TONE_CLASSES: Record<"indigo" | "rose" | "emerald", string> = {
  indigo: "bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent",
  rose: "text-rose-600",
  emerald: "text-emerald-600",
};

export function MetricBox({ label, value, tone = "indigo" }: { label: string; value: string; tone?: "indigo" | "rose" | "emerald" }) {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white px-5 py-4 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
      <div className={`text-2xl font-bold tracking-tight ${METRIC_TONE_CLASSES[tone]}`}>{value}</div>
    </div>
  );
}
