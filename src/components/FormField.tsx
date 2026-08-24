export function FormField({
  label,
  name,
  type = "text",
  defaultValue,
  step,
  required,
  hint,
  options,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  step?: string;
  required?: boolean;
  hint?: string;
  options?: { value: string; label: string }[];
}) {
  const baseClasses =
    "mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

  return (
    <label className="block text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
      {options ? (
        <select name={name} defaultValue={defaultValue ?? undefined} required={required} className={baseClasses}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          defaultValue={defaultValue ?? undefined}
          step={step}
          required={required}
          className={baseClasses}
        />
      )}
      {hint && <span className="mt-0.5 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  type = "submit",
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  type?: "submit" | "button";
}) {
  const classes = {
    primary:
      "bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-600/20 hover:shadow-md hover:shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500",
    secondary:
      "border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-750",
    danger: "bg-gradient-to-br from-rose-600 to-rose-500 text-white shadow-sm shadow-rose-600/20 hover:shadow-md hover:shadow-rose-600/30",
  }[variant];
  return (
    <button type={type} className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${classes}`}>
      {children}
    </button>
  );
}
