import type { LucideIcon } from "lucide-react";

export function Card({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-slate-200/70 bg-white shadow-sm shadow-slate-200/50 ring-1 ring-slate-900/[0.02] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {Icon && (
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
              </span>
            )}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
