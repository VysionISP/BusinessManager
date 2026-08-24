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
      className={`rounded-xl border border-slate-200 bg-white shadow-sm ring-1 ring-black/[0.02] dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5 dark:border-slate-800">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-100">
            {Icon && <Icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={2.25} />}
            {title}
          </h2>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
