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
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100";

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
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
    danger: "bg-rose-600 text-white hover:bg-rose-700",
  }[variant];
  return (
    <button type={type} className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${classes}`}>
      {children}
    </button>
  );
}
