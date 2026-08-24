export function startOfDay(d: Date = new Date()): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Monday of the week `offsetWeeks` weeks from the current week (0 = this week). */
export function mondayOfWeek(offsetWeeks = 0, from: Date = new Date()): Date {
  const d = startOfDay(from);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday + offsetWeeks * 7);
  return d;
}

export function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isWithinWeek(date: Date | string, weekStart: Date): boolean {
  const d = new Date(date);
  const weekEnd = addDays(weekStart, 7);
  return d >= weekStart && d < weekEnd;
}

const weekLabelFormatter = new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "short" });

export function formatWeekLabel(weekStart: Date): string {
  return `${weekLabelFormatter.format(weekStart)} – ${weekLabelFormatter.format(addDays(weekStart, 6))}`;
}
