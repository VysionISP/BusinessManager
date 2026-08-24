import type { AlertSeverity } from "@/lib/calculations";
import type { LucideIcon } from "lucide-react";

const ACCENT_CLASSES: Record<AlertSeverity, { bar: string; iconBg: string; iconText: string; badgeBg: string; badgeText: string }> = {
  green: {
    bar: "before:bg-emerald-500",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/50",
    iconText: "text-emerald-600 dark:text-emerald-400",
    badgeBg: "bg-emerald-100 dark:bg-emerald-950/60",
    badgeText: "text-emerald-700 dark:text-emerald-300",
  },
  orange: {
    bar: "before:bg-amber-500",
    iconBg: "bg-amber-50 dark:bg-amber-950/50",
    iconText: "text-amber-600 dark:text-amber-400",
    badgeBg: "bg-amber-100 dark:bg-amber-950/60",
    badgeText: "text-amber-700 dark:text-amber-300",
  },
  red: {
    bar: "before:bg-rose-500",
    iconBg: "bg-rose-50 dark:bg-rose-950/50",
    iconText: "text-rose-600 dark:text-rose-400",
    badgeBg: "bg-rose-100 dark:bg-rose-950/60",
    badgeText: "text-rose-700 dark:text-rose-300",
  },
};

const NEUTRAL = {
  bar: "before:bg-slate-200 dark:before:bg-slate-700",
  iconBg: "bg-slate-100 dark:bg-slate-800",
  iconText: "text-slate-500 dark:text-slate-400",
  badgeBg: "bg-slate-100 dark:bg-slate-800",
  badgeText: "text-slate-500 dark:text-slate-400",
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
    <div
      className={`relative overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md before:absolute before:inset-y-0 before:left-0 before:w-1 dark:border-slate-800 dark:bg-slate-900 ${accent.bar}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</span>
        {Icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${accent.iconBg} ${accent.iconText}`}>
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
        )}
      </div>
      <div className="mt-2 text-[1.65rem] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">{value}</div>
      {sublabel && <div className="mt-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">{sublabel}</div>}
    </div>
  );
}

export function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{children}</div>;
}
