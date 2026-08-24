// Core business calculations.
//
// Three concepts are kept deliberately separate throughout this file,
// per the product's core principle:
//   COST   — what it genuinely costs the business to do the work.
//   PROFIT — what a job earns after those costs (an accounting concept).
//   CASH   — when money actually moves in and out of the bank.
// A profitable job can still be a cash-flow problem while it's underway.
//
// All functions are pure and take plain data so they're easy to unit test
// and can be called from server components, API routes, or tests alike.

export interface EmployeeLike {
  payType: string; // "HOURLY" | "SALARY"
  baseHourlyRate: number;
  annualSalary?: number | null;
  ordinaryHoursPerWeek: number;
  overtimeHoursPerWeek: number;
  overtimeMultiplier: number;
  weeklyAllowances: number;
  superRatePercent: number;
  onCostPercent: number;
  expectedBillableHoursPerWeek: number;
  chargeOutRate: number;
}

export interface EmployeeCost {
  grossWage: number;
  super: number;
  onCosts: number;
  totalCost: number;
  costPerBillableHour: number;
}

/** Standard weekly gross wage for an employee, based on their contracted hours/salary. */
export function employeeWeeklyGrossWage(e: EmployeeLike): number {
  if (e.payType === "SALARY") {
    return (e.annualSalary ?? 0) / 52 + e.weeklyAllowances;
  }
  const ordinary = e.baseHourlyRate * e.ordinaryHoursPerWeek;
  const overtime = e.baseHourlyRate * e.overtimeMultiplier * e.overtimeHoursPerWeek;
  return ordinary + overtime + e.weeklyAllowances;
}

/**
 * Full "true cost" of an employee for a standard week: gross wage, plus
 * superannuation, plus other employer on-costs (WorkCover, leave loading,
 * insurances, etc.), divided down to a cost per billable hour.
 *
 * Note: for simplicity super and on-costs are calculated on total gross
 * wage (including allowances/overtime) rather than strict ordinary-time
 * earnings — a reasonable approximation for a trade business, not payroll
 * law.
 */
export function employeeTrueCost(e: EmployeeLike): EmployeeCost {
  const grossWage = employeeWeeklyGrossWage(e);
  const superAmt = grossWage * (e.superRatePercent / 100);
  const onCosts = grossWage * (e.onCostPercent / 100);
  const totalCost = grossWage + superAmt + onCosts;
  const costPerBillableHour = e.expectedBillableHoursPerWeek > 0 ? totalCost / e.expectedBillableHoursPerWeek : 0;
  return { grossWage, super: superAmt, onCosts, totalCost, costPerBillableHour };
}

export interface PayrollEntryLike {
  ordinaryHours: number;
  overtimeHours: number;
  allowances: number;
  leaveHours: number;
  sickHours: number;
  nonBillableHours: number;
  billableHours: number;
}

export interface PayrollEntryCost {
  grossWages: number;
  super: number;
  onCosts: number;
  totalCost: number;
}

/** Cost of a single employee's actual weekly timesheet, rather than their standard week. */
export function payrollEntryCost(e: EmployeeLike, entry: PayrollEntryLike): PayrollEntryCost {
  let grossWages: number;
  if (e.payType === "SALARY") {
    grossWages = (e.annualSalary ?? 0) / 52 + entry.allowances;
  } else {
    const paidOrdinary = entry.ordinaryHours + entry.leaveHours + entry.sickHours;
    grossWages = e.baseHourlyRate * paidOrdinary + e.baseHourlyRate * e.overtimeMultiplier * entry.overtimeHours + entry.allowances;
  }
  const superAmt = grossWages * (e.superRatePercent / 100);
  const onCosts = grossWages * (e.onCostPercent / 100);
  return { grossWages, super: superAmt, onCosts, totalCost: grossWages + superAmt + onCosts };
}

export interface WeeklyPayrollSummary {
  wages: number;
  super: number;
  onCosts: number;
  totalPayrollCost: number;
  totalBillableHours: number;
  totalPaidHours: number;
}

export function weeklyPayrollSummary(
  employees: EmployeeLike[],
  entries: { employeeIndex: number; entry: PayrollEntryLike }[],
): WeeklyPayrollSummary {
  const summary: WeeklyPayrollSummary = {
    wages: 0,
    super: 0,
    onCosts: 0,
    totalPayrollCost: 0,
    totalBillableHours: 0,
    totalPaidHours: 0,
  };
  for (const { employeeIndex, entry } of entries) {
    const employee = employees[employeeIndex];
    if (!employee) continue;
    const cost = payrollEntryCost(employee, entry);
    summary.wages += cost.grossWages;
    summary.super += cost.super;
    summary.onCosts += cost.onCosts;
    summary.totalPayrollCost += cost.totalCost;
    summary.totalBillableHours += entry.billableHours;
    summary.totalPaidHours += entry.ordinaryHours + entry.overtimeHours + entry.leaveHours + entry.sickHours;
  }
  return summary;
}

// ---------------------------------------------------------------------------
// Overheads
// ---------------------------------------------------------------------------

export interface OverheadLike {
  amount: number;
  frequency: string; // "WEEKLY" | "MONTHLY" | "QUARTERLY" | "ANNUAL"
}

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

export function overheadWeeklyEquivalent(o: OverheadLike): number {
  switch (o.frequency) {
    case "WEEKLY":
      return o.amount;
    case "MONTHLY":
      return (o.amount * MONTHS_PER_YEAR) / WEEKS_PER_YEAR;
    case "QUARTERLY":
      return (o.amount * 4) / WEEKS_PER_YEAR;
    case "ANNUAL":
      return o.amount / WEEKS_PER_YEAR;
    default:
      return 0;
  }
}

export function overheadMonthlyEquivalent(o: OverheadLike): number {
  return (overheadWeeklyEquivalent(o) * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
}

export function overheadAnnualEquivalent(o: OverheadLike): number {
  return overheadWeeklyEquivalent(o) * WEEKS_PER_YEAR;
}

export function totalWeeklyOverheads(overheads: OverheadLike[]): number {
  return overheads.reduce((sum, o) => sum + overheadWeeklyEquivalent(o), 0);
}

// ---------------------------------------------------------------------------
// Business running costs & labour stats (dashboard)
// ---------------------------------------------------------------------------

export interface BusinessRunningCosts {
  weeklyWages: number;
  weeklySuper: number;
  weeklyOnCosts: number;
  weeklyOverheads: number;
  totalWeeklyCost: number;
  monthlyCost: number;
  annualCost: number;
}

export function businessRunningCosts(employees: EmployeeLike[], overheads: OverheadLike[]): BusinessRunningCosts {
  let weeklyWages = 0;
  let weeklySuper = 0;
  let weeklyOnCosts = 0;
  for (const e of employees) {
    const cost = employeeTrueCost(e);
    weeklyWages += cost.grossWage;
    weeklySuper += cost.super;
    weeklyOnCosts += cost.onCosts;
  }
  const weeklyOverheads = totalWeeklyOverheads(overheads);
  const totalWeeklyCost = weeklyWages + weeklySuper + weeklyOnCosts + weeklyOverheads;
  return {
    weeklyWages,
    weeklySuper,
    weeklyOnCosts,
    weeklyOverheads,
    totalWeeklyCost,
    monthlyCost: (totalWeeklyCost * WEEKS_PER_YEAR) / MONTHS_PER_YEAR,
    annualCost: totalWeeklyCost * WEEKS_PER_YEAR,
  };
}

export interface LabourStats {
  employeeCount: number;
  totalAvailableHours: number;
  totalBillableHours: number;
  utilisationPercent: number;
  avgCostPerHour: number;
  breakEvenCostPerHour: number;
  avgChargeOutRate: number;
}

export function labourStats(employees: EmployeeLike[], overheads: OverheadLike[]): LabourStats {
  const employeeCount = employees.length;
  let totalAvailableHours = 0;
  let totalBillableHours = 0;
  let totalChargeOutValue = 0;
  for (const e of employees) {
    totalAvailableHours += e.ordinaryHoursPerWeek + e.overtimeHoursPerWeek;
    totalBillableHours += e.expectedBillableHoursPerWeek;
    totalChargeOutValue += e.chargeOutRate * e.expectedBillableHoursPerWeek;
  }
  const running = businessRunningCosts(employees, overheads);
  const utilisationPercent = totalAvailableHours > 0 ? (totalBillableHours / totalAvailableHours) * 100 : 0;
  const avgCostPerHour = totalBillableHours > 0 ? (running.weeklyWages + running.weeklySuper + running.weeklyOnCosts) / totalBillableHours : 0;
  const breakEvenCostPerHour = totalBillableHours > 0 ? running.totalWeeklyCost / totalBillableHours : 0;
  const avgChargeOutRate = totalBillableHours > 0 ? totalChargeOutValue / totalBillableHours : 0;
  return {
    employeeCount,
    totalAvailableHours,
    totalBillableHours,
    utilisationPercent,
    avgCostPerHour,
    breakEvenCostPerHour,
    avgChargeOutRate,
  };
}

// ---------------------------------------------------------------------------
// Break-even & margin
// ---------------------------------------------------------------------------

/** Break-even cost per billable hour: total weekly running cost / total billable hours. */
export function breakEvenHourlyRate(totalWeeklyRunningCost: number, totalBillableHours: number): number {
  return totalBillableHours > 0 ? totalWeeklyRunningCost / totalBillableHours : 0;
}

/**
 * Rate (or price) required to achieve a target PROFIT MARGIN over a cost base.
 * Margin is profit as a percentage of the selling price (not of cost — that's
 * markup). price = cost / (1 - margin%).
 *
 * e.g. break-even cost $116.67/hr at a 20% target margin => $145.84/hr,
 * matching the worked example in the product spec.
 */
export function priceForMargin(cost: number, marginPercent: number): number {
  const marginFraction = marginPercent / 100;
  if (marginFraction >= 1) return Infinity;
  return cost / (1 - marginFraction);
}

/** The inverse: profit margin implied by a given cost and selling price. */
export function marginFromPrice(cost: number, price: number): number {
  if (price <= 0) return 0;
  return ((price - cost) / price) * 100;
}

/** Markup (profit as % of cost) — shown alongside margin so the two are never confused. */
export function markupFromPrice(cost: number, price: number): number {
  if (cost <= 0) return 0;
  return ((price - cost) / cost) * 100;
}

// ---------------------------------------------------------------------------
// Quote calculator
// ---------------------------------------------------------------------------

export interface QuoteInputs {
  estimatedHours: number;
  materialCost: number;
  subcontractorCost: number;
  equipmentHire: number;
  travel: number;
  accommodation: number;
  otherDirectExpenses: number;
}

export interface QuoteBreakdown {
  labourCost: number;
  directJobCost: number;
}

export function quoteDirectCost(inputs: QuoteInputs, breakEvenLabourRate: number): QuoteBreakdown {
  const labourCost = inputs.estimatedHours * breakEvenLabourRate;
  const directJobCost =
    labourCost +
    inputs.materialCost +
    inputs.subcontractorCost +
    inputs.equipmentHire +
    inputs.travel +
    inputs.accommodation +
    inputs.otherDirectExpenses;
  return { labourCost, directJobCost };
}

export interface QuoteAtMargin {
  marginPercent: number;
  price: number;
  profit: number;
  markupPercent: number;
}

export function quoteAtMargins(directJobCost: number, marginPercents: number[]): QuoteAtMargin[] {
  return marginPercents.map((marginPercent) => {
    const price = priceForMargin(directJobCost, marginPercent);
    return {
      marginPercent,
      price,
      profit: price - directJobCost,
      markupPercent: markupFromPrice(directJobCost, price),
    };
  });
}

// ---------------------------------------------------------------------------
// Job budget, actual, forecast & WIP
// ---------------------------------------------------------------------------

export interface JobBudgetLike {
  quoteAmount: number;
  budgetLabourHours: number;
  budgetLabourCost: number;
  budgetMaterials: number;
  budgetSubcontractors: number;
  budgetOtherDirectCosts: number;
  percentComplete: number;
}

export interface JobCostEntryLike {
  category: string; // JobCostCategory
  amount: number;
  hours?: number | null;
}

export function jobBudgetTotal(job: JobBudgetLike): number {
  return job.budgetLabourCost + job.budgetMaterials + job.budgetSubcontractors + job.budgetOtherDirectCosts;
}

export function jobExpectedProfit(job: JobBudgetLike): number {
  return job.quoteAmount - jobBudgetTotal(job);
}

export function jobExpectedMarginPercent(job: JobBudgetLike): number {
  return marginFromPrice(jobBudgetTotal(job), job.quoteAmount);
}

export interface ActualCostsByCategory {
  labour: number;
  materials: number;
  subcontractor: number;
  equipment: number;
  other: number;
  total: number;
  labourHours: number;
}

export function actualCostsByCategory(entries: JobCostEntryLike[]): ActualCostsByCategory {
  const result: ActualCostsByCategory = {
    labour: 0,
    materials: 0,
    subcontractor: 0,
    equipment: 0,
    other: 0,
    total: 0,
    labourHours: 0,
  };
  for (const entry of entries) {
    result.total += entry.amount;
    switch (entry.category) {
      case "LABOUR":
        result.labour += entry.amount;
        result.labourHours += entry.hours ?? 0;
        break;
      case "MATERIALS":
        result.materials += entry.amount;
        break;
      case "SUBCONTRACTOR":
        result.subcontractor += entry.amount;
        break;
      case "EQUIPMENT":
        result.equipment += entry.amount;
        break;
      default:
        result.other += entry.amount;
    }
  }
  return result;
}

export interface JobForecast {
  actualTotalCost: number;
  forecastFinalCost: number;
  forecastProfit: number;
  forecastMarginPercent: number;
}

/**
 * Forecasts the final cost of a job by extrapolating actual cost-to-date at
 * the current run rate implied by percentage complete. Before any progress
 * is recorded, the original budget is the best available estimate.
 */
export function jobForecast(job: JobBudgetLike, entries: JobCostEntryLike[]): JobForecast {
  const actual = actualCostsByCategory(entries);
  const forecastFinalCost =
    job.percentComplete > 0 ? actual.total / (job.percentComplete / 100) : jobBudgetTotal(job);
  const forecastProfit = job.quoteAmount - forecastFinalCost;
  const forecastMarginPercent = marginFromPrice(forecastFinalCost, job.quoteAmount);
  return { actualTotalCost: actual.total, forecastFinalCost, forecastProfit, forecastMarginPercent };
}

export interface WipResult {
  contractValue: number;
  earnedValue: number;
  totalInvoiced: number;
  managementWip: number;
}

/**
 * Management estimate of Work In Progress: value of work completed
 * (contract value x % complete) less what's actually been invoiced.
 * This is a management indicator only, not formal revenue recognition.
 */
export function jobWip(job: JobBudgetLike, totalInvoiced: number): WipResult {
  const earnedValue = job.quoteAmount * (job.percentComplete / 100);
  return {
    contractValue: job.quoteAmount,
    earnedValue,
    totalInvoiced,
    managementWip: earnedValue - totalInvoiced,
  };
}

// ---------------------------------------------------------------------------
// Job cash position
// ---------------------------------------------------------------------------

export interface JobCashPosition {
  cashSpent: number;
  cashReceived: number;
  cashPosition: number; // negative = business is funding the job
}

export function jobCashPosition(actualTotalCost: number, cashReceived: number): JobCashPosition {
  return {
    cashSpent: actualTotalCost,
    cashReceived,
    cashPosition: cashReceived - actualTotalCost,
  };
}

// ---------------------------------------------------------------------------
// Invoicing
// ---------------------------------------------------------------------------

export interface InvoiceLike {
  amount: number;
  dueDate: Date | string;
}

export interface PaymentLike {
  amount: number;
}

export function invoiceOutstanding(invoiceAmount: number, paymentsForInvoice: PaymentLike[]): number {
  const paid = paymentsForInvoice.reduce((sum, p) => sum + p.amount, 0);
  return invoiceAmount - paid;
}

export function daysOverdue(dueDate: Date | string, outstanding: number, now: Date = new Date()): number {
  if (outstanding <= 0) return 0;
  const due = new Date(dueDate);
  const diffMs = now.getTime() - due.getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return days > 0 ? days : 0;
}

// ---------------------------------------------------------------------------
// Job overhead allocation (for margin reporting / P&L)
// ---------------------------------------------------------------------------

/** Allocates business overhead to a job in proportion to its actual labour hours. */
export function allocateOverheadToJob(jobLabourHours: number, businessWeeklyOverheads: number, businessWeeklyBillableHours: number): number {
  if (businessWeeklyBillableHours <= 0) return 0;
  return (businessWeeklyOverheads / businessWeeklyBillableHours) * jobLabourHours;
}

// ---------------------------------------------------------------------------
// Alert thresholds
// ---------------------------------------------------------------------------

export const CASH_FUNDING_ALERT_FRACTION = 0.15; // job cash position red when business funds > 15% of contract value

export type AlertSeverity = "green" | "orange" | "red";

export function trafficLight(value: number, warnThreshold: number, dangerThreshold: number, higherIsBetter = true): AlertSeverity {
  if (higherIsBetter) {
    if (value < dangerThreshold) return "red";
    if (value < warnThreshold) return "orange";
    return "green";
  }
  if (value > dangerThreshold) return "red";
  if (value > warnThreshold) return "orange";
  return "green";
}

// ---------------------------------------------------------------------------
// Combined per-job financial summary — the single source of truth used by
// the jobs list, job detail page, and margin reporting so cost/profit/cash
// are always derived the same way.
// ---------------------------------------------------------------------------

export interface JobLike extends JobBudgetLike {
  id: number;
  jobNumber: string;
  customerName: string;
  status: string;
  targetMarginPercent?: number | null;
}

export interface InvoiceWithId extends InvoiceLike {
  id: number;
  invoiceNumber: string;
  type: string;
  issueDate: Date | string;
}

export interface PaymentWithInvoiceId extends PaymentLike {
  invoiceId: number;
  date: Date | string;
}

export interface InvoiceSummary extends InvoiceWithId {
  paid: number;
  outstanding: number;
  daysOverdue: number;
}

export interface JobFinancials {
  job: JobLike;
  actual: ActualCostsByCategory;
  forecast: JobForecast;
  budgetTotal: number;
  expectedProfit: number;
  expectedMarginPercent: number;
  wip: WipResult;
  cash: JobCashPosition;
  invoices: InvoiceSummary[];
  totalInvoiced: number;
  totalReceived: number;
  totalOutstanding: number;
  targetMarginPercent: number;
  belowTargetMargin: boolean;
  overBudgetLabourHours: boolean;
  overBudgetMaterials: boolean;
  heavyCashFunding: boolean;
  hasOverdueInvoice: boolean;
}

export function computeJobFinancials(
  job: JobLike,
  costEntries: JobCostEntryLike[],
  invoices: InvoiceWithId[],
  payments: PaymentWithInvoiceId[],
  businessTargetMarginPercent: number,
  now: Date = new Date(),
): JobFinancials {
  const actual = actualCostsByCategory(costEntries);
  const forecast = jobForecast(job, costEntries);
  const budgetTotal = jobBudgetTotal(job);
  const expectedProfit = jobExpectedProfit(job);
  const expectedMarginPercent = jobExpectedMarginPercent(job);

  const invoiceSummaries: InvoiceSummary[] = invoices.map((inv) => {
    const invoicePayments = payments.filter((p) => p.invoiceId === inv.id);
    const outstanding = invoiceOutstanding(inv.amount, invoicePayments);
    return {
      ...inv,
      paid: inv.amount - outstanding,
      outstanding,
      daysOverdue: daysOverdue(inv.dueDate, outstanding, now),
    };
  });

  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalReceived = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalOutstanding = totalInvoiced - totalReceived;

  const wip = jobWip(job, totalInvoiced);
  const cash = jobCashPosition(actual.total, totalReceived);

  const targetMarginPercent = job.targetMarginPercent ?? businessTargetMarginPercent;

  return {
    job,
    actual,
    forecast,
    budgetTotal,
    expectedProfit,
    expectedMarginPercent,
    wip,
    cash,
    invoices: invoiceSummaries,
    totalInvoiced,
    totalReceived,
    totalOutstanding,
    targetMarginPercent,
    belowTargetMargin: forecast.forecastMarginPercent < targetMarginPercent,
    overBudgetLabourHours: job.budgetLabourHours > 0 && actual.labourHours > job.budgetLabourHours,
    overBudgetMaterials: job.budgetMaterials > 0 && actual.materials > job.budgetMaterials,
    heavyCashFunding: job.quoteAmount > 0 && cash.cashPosition < -(CASH_FUNDING_ALERT_FRACTION * job.quoteAmount),
    hasOverdueInvoice: invoiceSummaries.some((inv) => inv.daysOverdue > 0),
  };
}
