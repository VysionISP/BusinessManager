// String-literal unions for the "enum-like" fields stored as plain
// strings in SQLite (Prisma has no native SQLite enum support).

export const EMPLOYEE_TYPES = ["EMPLOYEE", "SUBCONTRACTOR"] as const;
export type EmployeeType = (typeof EMPLOYEE_TYPES)[number];

export const PAY_TYPES = ["HOURLY", "SALARY"] as const;
export type PayType = (typeof PAY_TYPES)[number];

export const OVERHEAD_CATEGORIES = [
  "INSURANCE",
  "VEHICLES",
  "SOFTWARE",
  "COMMUNICATIONS",
  "ADMINISTRATION",
  "TOOLS_EQUIPMENT",
  "LICENCES_COMPLIANCE",
  "OTHER",
] as const;
export type OverheadCategory = (typeof OVERHEAD_CATEGORIES)[number];

export const OVERHEAD_CATEGORY_LABELS: Record<OverheadCategory, string> = {
  INSURANCE: "Insurance",
  VEHICLES: "Vehicles",
  SOFTWARE: "Software",
  COMMUNICATIONS: "Communications",
  ADMINISTRATION: "Business administration",
  TOOLS_EQUIPMENT: "Tools & equipment",
  LICENCES_COMPLIANCE: "Licences & compliance",
  OTHER: "Other",
};

export const EXPENSE_FREQUENCIES = ["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL"] as const;
export type ExpenseFrequency = (typeof EXPENSE_FREQUENCIES)[number];

export const JOB_STATUSES = [
  "LEAD",
  "QUOTED",
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETE",
  "INVOICED",
  "PAID",
  "LOST",
] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  LEAD: "Lead",
  QUOTED: "Quoted",
  APPROVED: "Approved",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
  PAID: "Paid",
  LOST: "Lost",
};

// Statuses considered "active" for the purposes of running-job dashboards,
// WIP and cash-position reporting.
export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "APPROVED",
  "IN_PROGRESS",
  "COMPLETE",
  "INVOICED",
];

export const JOB_COST_CATEGORIES = ["LABOUR", "MATERIALS", "SUBCONTRACTOR", "EQUIPMENT", "OTHER"] as const;
export type JobCostCategory = (typeof JOB_COST_CATEGORIES)[number];

export const INVOICE_TYPES = ["DEPOSIT", "PROGRESS", "FINAL"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const CASHFLOW_DIRECTIONS = ["IN", "OUT"] as const;
export type CashflowDirection = (typeof CASHFLOW_DIRECTIONS)[number];

export const QUOTE_MARGIN_PRESETS = [10, 15, 20, 25, 30] as const;
