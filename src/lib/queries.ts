import { prisma } from "./db";
import { ACTIVE_JOB_STATUSES, OPEN_PO_STATUSES } from "./types";
import {
  type AlertSeverity,
  type JobFinancials,
  breakEvenHourlyRate,
  businessRunningCosts,
  committedCost,
  computeJobFinancials,
  employeeTrueCost,
  labourStats,
  priceForMargin,
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
}

export async function getDashboardData(): Promise<DashboardData> {
  const [employees, overheads, jobs, settings, openEnquiries, quotesAwaitingAction] = await Promise.all([
    getEmployees(true),
    getOverheads(true),
    getAllJobFinancials(),
    getSettings(),
    prisma.enquiry.count({ where: { status: { notIn: ["CONVERTED", "LOST", "NO_RESPONSE"] } } }),
    prisma.quote.count({ where: { status: { in: ["DRAFT", "SENT"] } } }),
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
