import { prisma } from "./db";
import { ACTIVE_JOB_STATUSES, OPEN_PO_STATUSES, OVERHEAD_CATEGORIES, OVERHEAD_CATEGORY_LABELS } from "./types";
import {
  type AlertSeverity,
  type JobFinancials,
  breakEvenHourlyRate,
  businessRunningCosts,
  committedCost,
  computeJobFinancials,
  employeeTrueCost,
  labourStats,
  overheadMonthlyEquivalent,
  payrollEntryCost,
  priceForMargin,
  quoteTotals,
  trafficLight,
} from "./calculations";
import { addDays, mondayOfWeek } from "./dates";

export async function getSettings() {
  const existing = await prisma.settings.findFirst();
  if (existing) return existing;
  return prisma.settings.create({ data: {} });
}

export async function getEmployees(activeOnly = false) {
  return prisma.employee.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function getOverheads(activeOnly = false) {
  return prisma.overheadExpense.findMany({
    where: activeOnly ? { active: true } : undefined,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });
}

// ---------------------------------------------------------------------------
// Customers & sites
// ---------------------------------------------------------------------------

export async function getCustomers(activeOnly = false) {
  return prisma.customer.findMany({
    where: activeOnly ? { active: true } : undefined,
    include: { sites: true, _count: { select: { jobs: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCustomerDetail(id: number) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      sites: { orderBy: { name: "asc" } },
      jobs: { orderBy: { createdAt: "desc" } },
      assets: { orderBy: { nextServiceDate: "asc" } },
      enquiries: { orderBy: { createdAt: "desc" } },
    },
  });
  return customer;
}

export async function getSitesForCustomer(customerId: number) {
  return prisma.site.findMany({ where: { customerId }, orderBy: { name: "asc" } });
}

export async function getAllSitesWithCustomer() {
  return prisma.site.findMany({ include: { customer: true }, orderBy: [{ customer: { name: "asc" } }, { name: "asc" }] });
}

/** Lightweight job list for pickers (purchase orders, scheduling, etc.) — avoids pulling full financials. */
export async function getJobsForSelection() {
  return prisma.job.findMany({
    select: { id: true, jobNumber: true, customer: { select: { name: true } }, phases: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ---------------------------------------------------------------------------
// Jobs & financials
// ---------------------------------------------------------------------------

const jobFinancialsInclude = {
  customer: true,
  site: true,
  phases: { orderBy: { sortOrder: "asc" as const } },
  costEntries: true,
  invoices: { include: { payments: true } },
  variations: true,
  purchaseOrders: { include: { lines: true } },
};

async function getAllJobFinancials(): Promise<JobFinancials<Awaited<ReturnType<typeof fetchJobsForFinancials>>[number]>[]> {
  const [jobs, settings] = await Promise.all([fetchJobsForFinancials(), getSettings()]);

  return jobs.map((job) => {
    const payments = job.invoices.flatMap((inv) => inv.payments.map((p) => ({ ...p, invoiceId: inv.id })));
    const committed = committedCost(job.purchaseOrders, OPEN_PO_STATUSES);
    return computeJobFinancials(job, job.costEntries, job.invoices, payments, job.variations, committed, settings.targetMarginPercent);
  });
}

function fetchJobsForFinancials() {
  return prisma.job.findMany({ include: jobFinancialsInclude, orderBy: { createdAt: "desc" } });
}

export async function getJobsWithFinancials() {
  return getAllJobFinancials();
}

export async function getJobDetail(id: number) {
  const [job, settings] = await Promise.all([
    prisma.job.findUnique({
      where: { id },
      include: {
        customer: true,
        site: true,
        projectManager: true,
        enquiry: true,
        phases: { orderBy: { sortOrder: "asc" } },
        costEntries: { orderBy: { date: "desc" }, include: { phase: true } },
        invoices: { include: { payments: { orderBy: { date: "desc" } } }, orderBy: { issueDate: "desc" } },
        variations: { orderBy: { createdAt: "desc" } },
        purchaseOrders: { include: { lines: true, supplier: true }, orderBy: { createdAt: "desc" } },
        supplierInvoices: { include: { supplier: true }, orderBy: { date: "desc" } },
        formSubmissions: { include: { formTemplate: true }, orderBy: { submittedAt: "desc" } },
        scheduleEvents: { include: { employee: true }, orderBy: { startAt: "desc" } },
        quotes: { orderBy: { createdAt: "desc" } },
      },
    }),
    getSettings(),
  ]);
  if (!job) return null;
  const payments = job.invoices.flatMap((inv) => inv.payments.map((p) => ({ ...p, invoiceId: inv.id })));
  const committed = committedCost(job.purchaseOrders, OPEN_PO_STATUSES);
  const financials = computeJobFinancials(job, job.costEntries, job.invoices, payments, job.variations, committed, settings.targetMarginPercent);
  return { job, financials };
}

export interface DashboardData {
  runningCosts: ReturnType<typeof businessRunningCosts>;
  labour: ReturnType<typeof labourStats>;
  breakEvenRate: number;
  targetRate: number;
  jobs: Awaited<ReturnType<typeof getAllJobFinancials>>;
  activeJobs: Awaited<ReturnType<typeof getAllJobFinancials>>;
  jobsOverBudget: Awaited<ReturnType<typeof getAllJobFinancials>>;
  jobsBelowMargin: Awaited<ReturnType<typeof getAllJobFinancials>>;
  totalActiveJobValue: number;
  estimatedActiveProfit: number;
  avgActiveMarginPercent: number;
  totalWip: number;
  outstandingInvoices: number;
  overdueInvoiceTotal: number;
  cashExpectedIn4Weeks: number;
  cashTiedUpInJobs: number;
  wagesDue: number;
  superDue: number;
  billsDue: number;
  currentBankBalance: number;
  forecastBankBalance4Weeks: number;
  revenueNeededNext4Weeks: number;
  severities: Record<string, AlertSeverity>;
  settings: Awaited<ReturnType<typeof getSettings>>;
  openEnquiries: number;
  quotesAwaitingAction: number;
  enquiriesNeedingFollowUp: number;
  stalledQuotes: number;
  posAwaitingApproval: number;
  variationsAwaitingApproval: number;
  assetsOverdue: number;
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = new Date();
  const twoDaysAgo = addDays(now, -2);
  const [
    employees,
    overheads,
    jobs,
    settings,
    openEnquiries,
    quotesAwaitingAction,
    enquiriesNeedingFollowUp,
    stalledQuotes,
    posAwaitingApproval,
    variationsAwaitingApproval,
    assetsOverdue,
  ] = await Promise.all([
    getEmployees(true),
    getOverheads(true),
    getAllJobFinancials(),
    getSettings(),
    prisma.enquiry.count({ where: { status: { notIn: ["CONVERTED", "LOST", "NO_RESPONSE"] } } }),
    prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
    prisma.enquiry.count({ where: { status: { notIn: ["CONVERTED", "LOST", "NO_RESPONSE"] }, followUpDate: { lte: now } } }),
    prisma.quote.count({ where: { status: "DRAFT", createdAt: { lte: twoDaysAgo } } }),
    prisma.purchaseOrder.count({ where: { status: "APPROVAL_REQUIRED" } }),
    prisma.variation.count({ where: { status: "PENDING" } }),
    prisma.asset.count({ where: { nextServiceDate: { lte: now } } }),
  ]);

  const runningCosts = businessRunningCosts(employees, overheads);
  const labour = labourStats(employees, overheads);
  const breakEvenRate = breakEvenHourlyRate(runningCosts.totalWeeklyCost, labour.totalBillableHours);
  const targetRate = priceForMargin(breakEvenRate, settings.targetMarginPercent);

  const activeJobs = jobs.filter((jf) => ACTIVE_JOB_STATUSES.includes(jf.job.status as (typeof ACTIVE_JOB_STATUSES)[number]));
  const jobsOverBudget = activeJobs.filter((jf) => jf.overBudgetLabourHours || jf.overBudgetMaterials);
  const jobsBelowMargin = activeJobs.filter((jf) => jf.belowTargetMargin);

  const totalActiveJobValue = activeJobs.reduce((sum, jf) => sum + jf.revisedContractValue, 0);
  const estimatedActiveProfit = activeJobs.reduce((sum, jf) => sum + jf.forecast.forecastProfit, 0);
  const avgActiveMarginPercent = totalActiveJobValue > 0 ? (estimatedActiveProfit / totalActiveJobValue) * 100 : 0;
  const totalWip = activeJobs.reduce((sum, jf) => sum + Math.max(0, jf.wip.managementWip), 0);

  const allInvoices = jobs.flatMap((jf) => jf.invoices);
  const outstandingInvoices = allInvoices.reduce((sum, inv) => sum + Math.max(0, inv.outstanding), 0);
  const overdueInvoiceTotal = allInvoices.filter((inv) => inv.daysOverdue > 0).reduce((sum, inv) => sum + inv.outstanding, 0);

  const in4Weeks = addDays(mondayOfWeek(0), 28);
  const cashExpectedIn4Weeks = allInvoices
    .filter((inv) => inv.outstanding > 0 && new Date(inv.dueDate) <= in4Weeks)
    .reduce((sum, inv) => sum + inv.outstanding, 0);

  const cashTiedUpInJobs = activeJobs.reduce((sum, jf) => sum + Math.max(0, -jf.cash.cashPosition), 0);

  const wagesDue = runningCosts.weeklyWages;
  const superDue = runningCosts.weeklySuper;
  const billsDue = runningCosts.weeklyOverheads;
  const currentBankBalance = settings.openingBankBalance;
  const forecastBankBalance4Weeks =
    currentBankBalance + cashExpectedIn4Weeks - (wagesDue + superDue + runningCosts.weeklyOnCosts + billsDue) * 4;

  const revenueNeededNext4Weeks = priceForMargin(runningCosts.totalWeeklyCost * 4, settings.targetMarginPercent);

  const severities: Record<string, AlertSeverity> = {
    runningCosts: "green",
    utilisation: trafficLight(labour.utilisationPercent, settings.targetUtilisationPercent - 10, settings.targetUtilisationPercent - 25),
    chargeOutVsBreakEven: labour.avgChargeOutRate >= breakEvenRate ? (labour.avgChargeOutRate >= targetRate ? "green" : "orange") : "red",
    jobMargin: jobsBelowMargin.length === 0 ? "green" : jobsBelowMargin.length <= 1 ? "orange" : "red",
    cashTiedUp: trafficLight(cashTiedUpInJobs, totalActiveJobValue * 0.1, totalActiveJobValue * 0.25, false),
    overdueInvoices: trafficLight(overdueInvoiceTotal, 1, outstandingInvoices * 0.5 + 1, false),
    bankBalance: trafficLight(forecastBankBalance4Weeks, wagesDue, 0),
  };

  return {
    runningCosts,
    labour,
    breakEvenRate,
    targetRate,
    jobs,
    activeJobs,
    jobsOverBudget,
    jobsBelowMargin,
    totalActiveJobValue,
    estimatedActiveProfit,
    avgActiveMarginPercent,
    totalWip,
    outstandingInvoices,
    overdueInvoiceTotal,
    cashExpectedIn4Weeks,
    cashTiedUpInJobs,
    wagesDue,
    superDue,
    billsDue,
    currentBankBalance,
    forecastBankBalance4Weeks,
    revenueNeededNext4Weeks,
    severities,
    settings,
    openEnquiries,
    quotesAwaitingAction,
    enquiriesNeedingFollowUp,
    stalledQuotes,
    posAwaitingApproval,
    variationsAwaitingApproval,
    assetsOverdue,
  };
}

export interface CashflowWeek {
  weekStarting: Date;
  cashIn: { customerPayments: number; other: number; total: number };
  cashOut: { wages: number; super: number; overheads: number; other: number; total: number };
  openingBalance: number;
  closingBalance: number;
  isNegative: boolean;
}

export async function getCashflowForecast(weeks: number): Promise<CashflowWeek[]> {
  const [employees, overheads, jobs, settings, adjustments] = await Promise.all([
    getEmployees(true),
    getOverheads(true),
    getAllJobFinancials(),
    getSettings(),
    prisma.cashflowAdjustment.findMany(),
  ]);

  const runningCosts = businessRunningCosts(employees, overheads);
  const weeklyWagesSuperOnCosts = runningCosts.weeklyWages + runningCosts.weeklySuper + runningCosts.weeklyOnCosts;
  const allInvoices = jobs.flatMap((jf) => jf.invoices.filter((inv) => inv.outstanding > 0));

  const results: CashflowWeek[] = [];
  let openingBalance = settings.openingBankBalance;

  for (let i = 0; i < weeks; i++) {
    const weekStart = mondayOfWeek(i);
    const weekEnd = addDays(weekStart, 7);

    const invoicesThisWeek = allInvoices.filter((inv) => {
      const due = new Date(inv.dueDate);
      if (i === 0) return due < weekEnd; // sweep up anything already overdue into week 1
      return due >= weekStart && due < weekEnd;
    });
    const customerPayments = invoicesThisWeek.reduce((sum, inv) => sum + inv.outstanding, 0);

    const weekAdjustments = adjustments.filter((a) => {
      const start = new Date(a.weekStarting);
      return start >= weekStart && start < weekEnd;
    });
    const adjIn = weekAdjustments.filter((a) => a.direction === "IN").reduce((sum, a) => sum + a.amount, 0);
    const adjOut = weekAdjustments.filter((a) => a.direction === "OUT").reduce((sum, a) => sum + a.amount, 0);

    const cashInTotal = customerPayments + adjIn;
    const cashOutTotal = weeklyWagesSuperOnCosts + runningCosts.weeklyOverheads + adjOut;
    const closingBalance = openingBalance + cashInTotal - cashOutTotal;

    results.push({
      weekStarting: weekStart,
      cashIn: { customerPayments, other: adjIn, total: cashInTotal },
      cashOut: { wages: runningCosts.weeklyWages, super: runningCosts.weeklySuper, overheads: runningCosts.weeklyOverheads, other: adjOut + runningCosts.weeklyOnCosts, total: cashOutTotal },
      openingBalance,
      closingBalance,
      isNegative: closingBalance < 0,
    });

    openingBalance = closingBalance;
  }

  return results;
}

export interface ReportsData {
  jobs: Awaited<ReturnType<typeof getAllJobFinancials>>;
  profitLoss: {
    revenue: number;
    labour: number;
    materials: number;
    subcontractors: number;
    otherDirect: number;
    directCosts: number;
    grossProfit: number;
    grossProfitMarginPercent: number;
    overheads: number;
    operatingProfit: number;
    netOperatingMarginPercent: number;
  };
  employeeProductivity: {
    id: number;
    name: string;
    role: string;
    paidHours: number;
    billableHours: number;
    nonBillableHours: number;
    utilisationPercent: number;
    revenueGenerated: number;
    labourCost: number;
    grossProfitContribution: number;
  }[];
}

export async function getReportsData(): Promise<ReportsData> {
  const [jobs, employees, expenses, payrollEntries] = await Promise.all([
    getAllJobFinancials(),
    getEmployees(true),
    prisma.expense.findMany(),
    prisma.payrollEntry.findMany({ include: { employee: true } }),
  ]);

  const closedOrActive = jobs.filter((jf) => jf.job.status !== "LEAD" && jf.job.status !== "LOST" && jf.job.status !== "QUOTED");
  const revenue = closedOrActive.reduce((sum, jf) => sum + jf.revisedContractValue, 0);
  const labour = closedOrActive.reduce((sum, jf) => sum + jf.actual.labour, 0);
  const materials = closedOrActive.reduce((sum, jf) => sum + jf.actual.materials, 0);
  const subcontractors = closedOrActive.reduce((sum, jf) => sum + jf.actual.subcontractor, 0);
  const otherDirect = closedOrActive.reduce((sum, jf) => sum + jf.actual.equipment + jf.actual.other, 0);
  const directCosts = labour + materials + subcontractors + otherDirect;
  const grossProfit = revenue - directCosts;
  const overheadExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const operatingProfit = grossProfit - overheadExpenses;

  const profitLoss = {
    revenue,
    labour,
    materials,
    subcontractors,
    otherDirect,
    directCosts,
    grossProfit,
    grossProfitMarginPercent: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    overheads: overheadExpenses,
    operatingProfit,
    netOperatingMarginPercent: revenue > 0 ? (operatingProfit / revenue) * 100 : 0,
  };

  const employeeProductivity = employees
    .filter((e) => e.employeeType === "EMPLOYEE")
    .map((e) => {
      const entries = payrollEntries.filter((p) => p.employeeId === e.id);
      const paidHours = entries.reduce((sum, p) => sum + p.ordinaryHours + p.overtimeHours + p.leaveHours + p.sickHours, 0);
      const billableHours = entries.reduce((sum, p) => sum + p.billableHours, 0);
      const nonBillableHours = entries.reduce((sum, p) => sum + p.nonBillableHours, 0);
      const utilisationPercent = paidHours > 0 ? (billableHours / paidHours) * 100 : 0;
      const revenueGenerated = billableHours * e.chargeOutRate;
      return { id: e.id, name: e.name, role: e.role, paidHours, billableHours, nonBillableHours, utilisationPercent, revenueGenerated, labourCost: 0, grossProfitContribution: 0 };
    });

  // Second pass: use each employee's true weekly cost x number of weeks with entries for a fair labour-cost comparison.
  for (const row of employeeProductivity) {
    const employee = employees.find((e) => e.id === row.id)!;
    const weeks = new Set(payrollEntries.filter((p) => p.employeeId === row.id).map((p) => p.weekCommencing.toISOString())).size || 1;
    row.labourCost = employeeTrueCost(employee).totalCost * weeks;
    row.grossProfitContribution = row.revenueGenerated - row.labourCost;
  }

  return { jobs, profitLoss, employeeProductivity };
}

export interface BudgetVsActualRow {
  key: string;
  label: string;
  budget: number;
  actual: number;
  variance: number;
  percentVariance: number;
}

export interface BudgetVsActualData {
  monthStart: Date;
  rows: BudgetVsActualRow[];
  totalBudget: number;
  totalActual: number;
}

function monthRow(key: string, label: string, budget: number, actual: number): BudgetVsActualRow {
  const variance = actual - budget;
  return { key, label, budget, actual, variance, percentVariance: budget > 0 ? (variance / budget) * 100 : 0 };
}

/**
 * Budget = the Overheads register's monthly-equivalent (plus modelled wages/
 * super) — i.e. what you already told the app you plan to spend. Actual =
 * recorded Expenses (plus real payroll cost) for the selected month. This
 * reuses the Overheads register and Expenses log rather than asking for a
 * separate monthly budget figure per category.
 */
export async function getBudgetVsActual(monthStart: Date): Promise<BudgetVsActualData> {
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);

  const [employees, overheads, expenses, payrollEntries] = await Promise.all([
    getEmployees(true),
    getOverheads(true),
    prisma.expense.findMany({ where: { date: { gte: monthStart, lt: monthEnd } } }),
    prisma.payrollEntry.findMany({ where: { weekCommencing: { gte: monthStart, lt: monthEnd } }, include: { employee: true } }),
  ]);

  const runningCosts = businessRunningCosts(employees, overheads);
  const wagesBudget = (runningCosts.weeklyWages * 52) / 12;
  const superBudget = (runningCosts.weeklySuper * 52) / 12;

  let wagesActual = 0;
  let superActual = 0;
  for (const entry of payrollEntries) {
    const cost = payrollEntryCost(entry.employee, entry);
    wagesActual += cost.grossWages;
    superActual += cost.super;
  }

  const rows: BudgetVsActualRow[] = [monthRow("WAGES", "Wages", wagesBudget, wagesActual), monthRow("SUPER", "Super", superBudget, superActual)];

  for (const category of OVERHEAD_CATEGORIES) {
    const categoryOverheads = overheads.filter((o) => o.category === category);
    const budget = categoryOverheads.reduce((sum, o) => sum + overheadMonthlyEquivalent(o), 0);
    const actual = expenses.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0);
    if (budget === 0 && actual === 0) continue;
    rows.push(monthRow(category, OVERHEAD_CATEGORY_LABELS[category], budget, actual));
  }

  const totalBudget = rows.reduce((sum, r) => sum + r.budget, 0);
  const totalActual = rows.reduce((sum, r) => sum + r.actual, 0);

  return { monthStart, rows, totalBudget, totalActual };
}

export interface SalesAndPurchasingStats {
  enquiries: { total: number; converted: number; lost: number; conversionRatePercent: number };
  quotes: { total: number; accepted: number; declined: number; conversionRatePercent: number; avgValue: number };
  purchasing: {
    totalCommitted: number;
    openPoCount: number;
    spendBySupplier: { supplierName: string; total: number }[];
  };
}

export async function getSalesAndPurchasingStats(): Promise<SalesAndPurchasingStats> {
  const [enquiries, quotesWithLines, purchaseOrders, supplierInvoices] = await Promise.all([
    prisma.enquiry.findMany({ select: { status: true } }),
    prisma.quote.findMany({ select: { status: true, lines: true } }),
    prisma.purchaseOrder.findMany({ include: { lines: true } }),
    prisma.supplierInvoice.findMany({ include: { supplier: true } }),
  ]);

  const enquiryTotal = enquiries.length;
  const enquiryConverted = enquiries.filter((e) => e.status === "CONVERTED").length;
  const enquiryLost = enquiries.filter((e) => e.status === "LOST" || e.status === "NO_RESPONSE").length;

  const quoteTotal = quotesWithLines.length;
  const quoteAccepted = quotesWithLines.filter((q) => q.status === "ACCEPTED");
  const quoteDeclined = quotesWithLines.filter((q) => q.status === "DECLINED" || q.status === "EXPIRED").length;
  const quoteValues = quotesWithLines.map((q) => quoteTotals(q.lines).totalSell);

  const totalCommitted = committedCost(purchaseOrders, OPEN_PO_STATUSES);
  const openPoCount = purchaseOrders.filter((po) => OPEN_PO_STATUSES.includes(po.status as (typeof OPEN_PO_STATUSES)[number])).length;

  const spendMap = new Map<string, number>();
  for (const si of supplierInvoices) {
    spendMap.set(si.supplier.name, (spendMap.get(si.supplier.name) ?? 0) + si.amount);
  }
  const spendBySupplier = [...spendMap.entries()].map(([supplierName, total]) => ({ supplierName, total })).sort((a, b) => b.total - a.total);

  return {
    enquiries: {
      total: enquiryTotal,
      converted: enquiryConverted,
      lost: enquiryLost,
      conversionRatePercent: enquiryTotal > 0 ? (enquiryConverted / enquiryTotal) * 100 : 0,
    },
    quotes: {
      total: quoteTotal,
      accepted: quoteAccepted.length,
      declined: quoteDeclined,
      conversionRatePercent: quoteTotal > 0 ? (quoteAccepted.length / quoteTotal) * 100 : 0,
      avgValue: quoteValues.length > 0 ? quoteValues.reduce((a, b) => a + b, 0) / quoteValues.length : 0,
    },
    purchasing: { totalCommitted, openPoCount, spendBySupplier },
  };
}
