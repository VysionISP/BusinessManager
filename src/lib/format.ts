const currencyFormatter = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 0,
});

const currencyFormatterPrecise = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number, precise = false): string {
  if (!Number.isFinite(value)) return "—";
  return (precise ? currencyFormatterPrecise : currencyFormatter).format(value);
}

export function formatPercent(value: number, fractionDigits = 0): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(fractionDigits)}%`;
}

export function formatHours(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(1)} hrs`;
}

const dateFormatter = new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short", year: "numeric" });

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return dateFormatter.format(new Date(value));
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return d.toISOString().slice(0, 10);
}
