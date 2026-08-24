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

// ---------------------------------------------------------------------------
// Customers, sites & assets
// ---------------------------------------------------------------------------

export const CUSTOMER_TYPES = ["RESIDENTIAL", "COMMERCIAL", "BUILDER", "PROPERTY_MANAGER", "INTERNAL"] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  RESIDENTIAL: "Residential",
  COMMERCIAL: "Commercial",
  BUILDER: "Builder",
  PROPERTY_MANAGER: "Property manager",
  INTERNAL: "Internal / non-chargeable",
};

export const ASSET_TYPES = [
  "Switchboard",
  "RCD",
  "Emergency Light",
  "Generator",
  "UPS System",
  "CCTV Camera",
  "NVR",
  "Access Control Panel",
  "Intercom",
  "Network Switch",
  "Other",
] as const;

// ---------------------------------------------------------------------------
// Sales pipeline: enquiries & quotes
// ---------------------------------------------------------------------------

export const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACT_REQUIRED",
  "SITE_VISIT_REQUIRED",
  "INFO_REQUESTED",
  "READY_TO_QUOTE",
  "CONVERTED",
  "LOST",
  "NO_RESPONSE",
] as const;
export type EnquiryStatus = (typeof ENQUIRY_STATUSES)[number];

export const ENQUIRY_STATUS_LABELS: Record<EnquiryStatus, string> = {
  NEW: "New",
  CONTACT_REQUIRED: "Contact required",
  SITE_VISIT_REQUIRED: "Site visit required",
  INFO_REQUESTED: "Information requested",
  READY_TO_QUOTE: "Ready to quote",
  CONVERTED: "Converted",
  LOST: "Lost",
  NO_RESPONSE: "No response",
};

export const OPEN_ENQUIRY_STATUSES: EnquiryStatus[] = [
  "NEW",
  "CONTACT_REQUIRED",
  "SITE_VISIT_REQUIRED",
  "INFO_REQUESTED",
  "READY_TO_QUOTE",
];

export const ENQUIRY_URGENCIES = ["LOW", "NORMAL", "HIGH", "EMERGENCY"] as const;
export type EnquiryUrgency = (typeof ENQUIRY_URGENCIES)[number];

export const QUOTE_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "DECLINED", "EXPIRED"] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  EXPIRED: "Expired",
};

// ---------------------------------------------------------------------------
// Jobs, phases & variations
// ---------------------------------------------------------------------------

export const JOB_STATUSES = [
  "LEAD",
  "QUOTED",
  "APPROVED",
  "PENDING",
  "SCHEDULED",
  "IN_PROGRESS",
  "BACK_COSTING",
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
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  BACK_COSTING: "Back costing",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
  PAID: "Paid",
  LOST: "Lost",
};

// Statuses considered "active" for the purposes of running-job dashboards,
// WIP and cash-position reporting.
export const ACTIVE_JOB_STATUSES: JobStatus[] = [
  "APPROVED",
  "PENDING",
  "SCHEDULED",
  "IN_PROGRESS",
  "BACK_COSTING",
  "COMPLETE",
  "INVOICED",
];

export const PRICING_METHODS = ["FIXED_PRICE", "ESTIMATE", "CHARGE_UP"] as const;
export type PricingMethod = (typeof PRICING_METHODS)[number];

export const PRICING_METHOD_LABELS: Record<PricingMethod, string> = {
  FIXED_PRICE: "Fixed price",
  ESTIMATE: "Estimate",
  CHARGE_UP: "Charge-up",
};

export const PHASE_STATUSES = ["PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETE", "INVOICED"] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  PENDING: "Pending",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In progress",
  COMPLETE: "Complete",
  INVOICED: "Invoiced",
};

export const VARIATION_STATUSES = ["PENDING", "APPROVED", "DECLINED"] as const;
export type VariationStatus = (typeof VARIATION_STATUSES)[number];

export const VARIATION_STATUS_LABELS: Record<VariationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  DECLINED: "Declined",
};

export const JOB_COST_CATEGORIES = ["LABOUR", "MATERIALS", "SUBCONTRACTOR", "EQUIPMENT", "OTHER"] as const;
export type JobCostCategory = (typeof JOB_COST_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// Invoicing
// ---------------------------------------------------------------------------

export const INVOICE_TYPES = ["DEPOSIT", "PROGRESS", "FINAL", "VARIATION", "RETENTION"] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_TYPE_LABELS: Record<InvoiceType, string> = {
  DEPOSIT: "Deposit",
  PROGRESS: "Progress claim",
  FINAL: "Final",
  VARIATION: "Variation",
  RETENTION: "Retention release",
};

export const CASHFLOW_DIRECTIONS = ["IN", "OUT"] as const;
export type CashflowDirection = (typeof CASHFLOW_DIRECTIONS)[number];

export const QUOTE_MARGIN_PRESETS = [10, 15, 20, 25, 30] as const;

// ---------------------------------------------------------------------------
// Purchasing & suppliers
// ---------------------------------------------------------------------------

export const PO_STATUSES = [
  "DRAFT",
  "APPROVAL_REQUIRED",
  "APPROVED",
  "SENT",
  "PARTIALLY_SUPPLIED",
  "SUPPLIED",
  "INVOICED",
  "CLOSED",
  "CANCELLED",
] as const;
export type PoStatus = (typeof PO_STATUSES)[number];

export const PO_STATUS_LABELS: Record<PoStatus, string> = {
  DRAFT: "Draft",
  APPROVAL_REQUIRED: "Approval required",
  APPROVED: "Approved",
  SENT: "Sent to supplier",
  PARTIALLY_SUPPLIED: "Partially supplied",
  SUPPLIED: "Supplied",
  INVOICED: "Invoiced",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

// A PO still represents a real commitment of business cash until it's been
// fully invoiced (actualised) or cancelled.
export const OPEN_PO_STATUSES: PoStatus[] = ["DRAFT", "APPROVAL_REQUIRED", "APPROVED", "SENT", "PARTIALLY_SUPPLIED", "SUPPLIED"];

export const SUPPLIER_INVOICE_CATEGORIES = ["MATERIALS", "SUBCONTRACTOR", "EQUIPMENT", "OTHER"] as const;
export type SupplierInvoiceCategory = (typeof SUPPLIER_INVOICE_CATEGORIES)[number];

export const SUPPLIER_INVOICE_STATUSES = ["UNPAID", "PAID"] as const;
export type SupplierInvoiceStatus = (typeof SUPPLIER_INVOICE_STATUSES)[number];

// ---------------------------------------------------------------------------
// Forms & certificates
// ---------------------------------------------------------------------------

export const FORM_FIELD_TYPES = [
  "TEXT",
  "LONG_TEXT",
  "NUMBER",
  "DATE",
  "YES_NO",
  "DROPDOWN",
  "MULTIPLE_CHOICE",
  "SIGNATURE",
] as const;
export type FormFieldType = (typeof FORM_FIELD_TYPES)[number];

export const FORM_FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  TEXT: "Short text",
  LONG_TEXT: "Long text",
  NUMBER: "Number",
  DATE: "Date",
  YES_NO: "Yes / No",
  DROPDOWN: "Dropdown",
  MULTIPLE_CHOICE: "Multiple choice",
  SIGNATURE: "Signature (typed name)",
};

export interface FormFieldDef {
  id: string;
  label: string;
  type: FormFieldType;
  options?: string[];
  required?: boolean;
}

// ---------------------------------------------------------------------------
// Scheduling & dispatch
// ---------------------------------------------------------------------------

export const SCHEDULE_EVENT_TYPES = [
  "QUOTE_VISIT",
  "WORK",
  "AFTER_HOURS",
  "SHUTDOWN",
  "INSPECTION",
  "TESTING",
  "SERVICE_CALL",
  "RETURN_VISIT",
  "TRAINING",
  "LEAVE",
  "OTHER",
] as const;
export type ScheduleEventType = (typeof SCHEDULE_EVENT_TYPES)[number];

export const SCHEDULE_EVENT_TYPE_LABELS: Record<ScheduleEventType, string> = {
  QUOTE_VISIT: "Quote visit",
  WORK: "Work",
  AFTER_HOURS: "After-hours work",
  SHUTDOWN: "Shutdown",
  INSPECTION: "Inspection",
  TESTING: "Testing",
  SERVICE_CALL: "Service call",
  RETURN_VISIT: "Return visit",
  TRAINING: "Training",
  LEAVE: "Leave",
  OTHER: "Other",
};

export const SCHEDULE_EVENT_STATUSES = ["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "DONE", "CANCELLED"] as const;
export type ScheduleEventStatus = (typeof SCHEDULE_EVENT_STATUSES)[number];
