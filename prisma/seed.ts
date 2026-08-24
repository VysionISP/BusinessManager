import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  return daysAgo(-n);
}

function mondayOfWeek(offsetWeeks: number): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diffToMonday + offsetWeeks * 7);
  return d;
}

async function main() {
  console.log("Seeding database...");

  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.jobCostEntry.deleteMany();
  await prisma.job.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.overheadExpense.deleteMany();
  await prisma.cashflowAdjustment.deleteMany();
  await prisma.settings.deleteMany();

  await prisma.settings.create({
    data: {
      businessName: "Voltline Electrical Pty Ltd",
      targetMarginPercent: 20,
      targetUtilisationPercent: 75,
      openingBankBalance: 42500,
    },
  });

  const dave = await prisma.employee.create({
    data: {
      name: "Dave Mitchell",
      role: "Licensed Electrician",
      employeeType: "EMPLOYEE",
      payType: "HOURLY",
      baseHourlyRate: 45,
      ordinaryHoursPerWeek: 38,
      overtimeHoursPerWeek: 4,
      overtimeMultiplier: 1.5,
      weeklyAllowances: 50,
      superRatePercent: 11.5,
      onCostPercent: 16,
      expectedBillableHoursPerWeek: 33,
      chargeOutRate: 115,
    },
  });

  const steve = await prisma.employee.create({
    data: {
      name: "Steve Kowalski",
      role: "Electrician",
      employeeType: "EMPLOYEE",
      payType: "HOURLY",
      baseHourlyRate: 42,
      ordinaryHoursPerWeek: 38,
      overtimeHoursPerWeek: 2,
      overtimeMultiplier: 1.5,
      weeklyAllowances: 30,
      superRatePercent: 11.5,
      onCostPercent: 16,
      expectedBillableHoursPerWeek: 32,
      chargeOutRate: 110,
    },
  });

  const mia = await prisma.employee.create({
    data: {
      name: "Mia Chen",
      role: "3rd Year Apprentice",
      employeeType: "EMPLOYEE",
      payType: "HOURLY",
      baseHourlyRate: 24,
      ordinaryHoursPerWeek: 38,
      overtimeHoursPerWeek: 0,
      overtimeMultiplier: 1.5,
      weeklyAllowances: 20,
      superRatePercent: 11.5,
      onCostPercent: 14,
      expectedBillableHoursPerWeek: 30,
      chargeOutRate: 85,
    },
  });

  const grace = await prisma.employee.create({
    data: {
      name: "Grace Whelan",
      role: "Office Manager",
      employeeType: "EMPLOYEE",
      payType: "SALARY",
      annualSalary: 68000,
      baseHourlyRate: 0,
      ordinaryHoursPerWeek: 38,
      overtimeHoursPerWeek: 0,
      overtimeMultiplier: 1,
      weeklyAllowances: 0,
      superRatePercent: 11.5,
      onCostPercent: 12,
      expectedBillableHoursPerWeek: 0,
      chargeOutRate: 0,
    },
  });

  const rossi = await prisma.employee.create({
    data: {
      name: "Rossi Electrical Contracting",
      role: "Subcontract Electrician",
      employeeType: "SUBCONTRACTOR",
      payType: "HOURLY",
      baseHourlyRate: 65,
      ordinaryHoursPerWeek: 20,
      overtimeHoursPerWeek: 0,
      overtimeMultiplier: 1,
      weeklyAllowances: 0,
      superRatePercent: 0,
      onCostPercent: 0,
      expectedBillableHoursPerWeek: 20,
      chargeOutRate: 140,
    },
  });

  const employees = [dave, steve, mia, grace];
  const hoursByEmployee: Record<number, { ord: number; ot: number; nb: number; bill: number }> = {
    [dave.id]: { ord: 38, ot: 4, nb: 7, bill: 35 },
    [steve.id]: { ord: 38, ot: 2, nb: 9, bill: 31 },
    [mia.id]: { ord: 38, ot: 0, nb: 12, bill: 26 },
    [grace.id]: { ord: 38, ot: 0, nb: 38, bill: 0 },
  };

  for (let week = -4; week <= -1; week++) {
    const weekCommencing = mondayOfWeek(week);
    for (const emp of employees) {
      const h = hoursByEmployee[emp.id];
      const jitter = (week + 4) * 0.5; // slight week-to-week variation
      await prisma.payrollEntry.create({
        data: {
          employeeId: emp.id,
          weekCommencing,
          ordinaryHours: h.ord,
          overtimeHours: Math.max(0, h.ot - jitter),
          allowances: emp.weeklyAllowances,
          leaveHours: 0,
          sickHours: 0,
          nonBillableHours: h.nb,
          billableHours: Math.max(0, h.bill - jitter),
        },
      });
    }
  }

  console.log("Employees & payroll history seeded.");

  const overheads: {
    category: string;
    name: string;
    amount: number;
    frequency: string;
  }[] = [
    { category: "INSURANCE", name: "Business & Public Liability Insurance", amount: 2100, frequency: "QUARTERLY" },
    { category: "INSURANCE", name: "Professional Indemnity Insurance", amount: 1450, frequency: "ANNUAL" },
    { category: "INSURANCE", name: "WorkCover", amount: 9800, frequency: "ANNUAL" },
    { category: "INSURANCE", name: "Vehicle Insurance", amount: 4200, frequency: "ANNUAL" },
    { category: "VEHICLES", name: "Vehicle Registration", amount: 1800, frequency: "ANNUAL" },
    { category: "VEHICLES", name: "Fuel", amount: 380, frequency: "WEEKLY" },
    { category: "VEHICLES", name: "Servicing & Tyres", amount: 450, frequency: "MONTHLY" },
    { category: "VEHICLES", name: "Vehicle Repairs", amount: 200, frequency: "MONTHLY" },
    { category: "VEHICLES", name: "Vehicle Replacement Allowance", amount: 600, frequency: "MONTHLY" },
    { category: "SOFTWARE", name: "Xero Subscription", amount: 75, frequency: "MONTHLY" },
    { category: "SOFTWARE", name: "Job Management Software", amount: 249, frequency: "MONTHLY" },
    { category: "SOFTWARE", name: "Microsoft 365 / Email", amount: 60, frequency: "MONTHLY" },
    { category: "COMMUNICATIONS", name: "Mobile Phones", amount: 220, frequency: "MONTHLY" },
    { category: "COMMUNICATIONS", name: "Internet", amount: 90, frequency: "MONTHLY" },
    { category: "ADMINISTRATION", name: "Accounting & Bookkeeping", amount: 850, frequency: "MONTHLY" },
    { category: "ADMINISTRATION", name: "Website & Domains", amount: 600, frequency: "ANNUAL" },
    { category: "ADMINISTRATION", name: "Advertising", amount: 400, frequency: "MONTHLY" },
    { category: "ADMINISTRATION", name: "Banking Costs", amount: 45, frequency: "MONTHLY" },
    { category: "ADMINISTRATION", name: "Stationery", amount: 60, frequency: "MONTHLY" },
    { category: "TOOLS_EQUIPMENT", name: "Tools & Tool Replacement", amount: 350, frequency: "MONTHLY" },
    { category: "TOOLS_EQUIPMENT", name: "Test Equipment Calibration", amount: 480, frequency: "QUARTERLY" },
    { category: "TOOLS_EQUIPMENT", name: "PPE & Uniforms", amount: 350, frequency: "QUARTERLY" },
    { category: "LICENCES_COMPLIANCE", name: "Electrical Licence Renewal", amount: 450, frequency: "ANNUAL" },
    { category: "LICENCES_COMPLIANCE", name: "Staff Training", amount: 900, frequency: "QUARTERLY" },
    { category: "LICENCES_COMPLIANCE", name: "Site Access / Induction Fees", amount: 150, frequency: "MONTHLY" },
  ];

  for (const o of overheads) {
    await prisma.overheadExpense.create({ data: o });
  }

  console.log("Overheads seeded.");

  // ---------------------------------------------------------------------
  // Jobs — deliberately span the full status range and include a job
  // that's over budget/below target margin and one with an overdue
  // invoice, so the dashboard and alerts have something real to show.
  // ---------------------------------------------------------------------

  const meadowbank = await prisma.job.create({
    data: {
      jobNumber: "J-2025-041",
      customerName: "Meadowbank Shopping Centre",
      description: "Tenancy fit-out electrical — 4 shopfronts",
      status: "INVOICED",
      quoteDate: daysAgo(70),
      startDate: daysAgo(60),
      expectedCompletionDate: daysAgo(20),
      quoteAmount: 48000,
      budgetLabourHours: 260,
      budgetLabourCost: 18500,
      budgetMaterials: 14000,
      budgetSubcontractors: 3000,
      budgetOtherDirectCosts: 500,
      percentComplete: 100,
    },
  });
  await prisma.jobCostEntry.createMany({
    data: [
      { jobId: meadowbank.id, date: daysAgo(55), category: "LABOUR", description: "Rough-in, weeks 1-4", hours: 190, amount: 13600 },
      { jobId: meadowbank.id, date: daysAgo(25), category: "LABOUR", description: "Fit-off, weeks 5-6", hours: 82, amount: 5900 },
      { jobId: meadowbank.id, date: daysAgo(50), category: "MATERIALS", description: "Cable, switchgear, LED fitout", amount: 14850 },
      { jobId: meadowbank.id, date: daysAgo(40), category: "SUBCONTRACTOR", description: "Data cabling subcontractor", amount: 3000 },
      { jobId: meadowbank.id, date: daysAgo(22), category: "OTHER", description: "Waste disposal, site fees", amount: 620 },
    ],
  });
  const mbDeposit = await prisma.invoice.create({
    data: { jobId: meadowbank.id, invoiceNumber: "INV-1041", type: "DEPOSIT", issueDate: daysAgo(68), dueDate: daysAgo(54), amount: 14400 },
  });
  const mbProgress = await prisma.invoice.create({
    data: { jobId: meadowbank.id, invoiceNumber: "INV-1052", type: "PROGRESS", issueDate: daysAgo(35), dueDate: daysAgo(21), amount: 19200 },
  });
  await prisma.invoice.create({
    data: { jobId: meadowbank.id, invoiceNumber: "INV-1067", type: "FINAL", issueDate: daysAgo(18), dueDate: daysAgo(4), amount: 14400 },
  });
  await prisma.payment.create({ data: { invoiceId: mbDeposit.id, date: daysAgo(60), amount: 14400 } });
  await prisma.payment.create({ data: { invoiceId: mbProgress.id, date: daysAgo(15), amount: 19200 } });
  // Final invoice left unpaid and now overdue on purpose.

  const nguyen = await prisma.job.create({
    data: {
      jobNumber: "J-2025-118",
      customerName: "Nguyen Residence",
      description: "Full home rewire, switchboard upgrade",
      status: "IN_PROGRESS",
      quoteDate: daysAgo(30),
      startDate: daysAgo(18),
      expectedCompletionDate: daysFromNow(10),
      quoteAmount: 22000,
      budgetLabourHours: 140,
      budgetLabourCost: 9800,
      budgetMaterials: 6500,
      budgetSubcontractors: 0,
      budgetOtherDirectCosts: 300,
      percentComplete: 55,
    },
  });
  await prisma.jobCostEntry.createMany({
    data: [
      { jobId: nguyen.id, date: daysAgo(16), category: "LABOUR", description: "Demo & rough-in", hours: 96, amount: 7900 },
      { jobId: nguyen.id, date: daysAgo(4), category: "LABOUR", description: "Switchboard upgrade", hours: 22, amount: 1800 },
      { jobId: nguyen.id, date: daysAgo(12), category: "MATERIALS", description: "Cable, board, downlights", amount: 6100 },
      { jobId: nguyen.id, date: daysAgo(6), category: "MATERIALS", description: "Additional cable (unforeseen access issue)", amount: 1450 },
      { jobId: nguyen.id, date: daysAgo(3), category: "OTHER", description: "Skip bin, disposal", amount: 280 },
    ],
  });
  const nguyenDeposit = await prisma.invoice.create({
    data: { jobId: nguyen.id, invoiceNumber: "INV-1071", type: "DEPOSIT", issueDate: daysAgo(28), dueDate: daysAgo(14), amount: 5000 },
  });
  await prisma.payment.create({ data: { invoiceId: nguyenDeposit.id, date: daysAgo(20), amount: 5000 } });

  await prisma.job.create({
    data: {
      jobNumber: "J-2025-122",
      customerName: "Harborview Cafe Fitout",
      description: "Commercial kitchen & shopfront electrical fitout",
      status: "APPROVED",
      quoteDate: daysAgo(10),
      startDate: daysFromNow(7),
      expectedCompletionDate: daysFromNow(35),
      quoteAmount: 35000,
      budgetLabourHours: 210,
      budgetLabourCost: 15200,
      budgetMaterials: 10500,
      budgetSubcontractors: 1800,
      budgetOtherDirectCosts: 400,
      percentComplete: 0,
    },
  });

  const sunridge = await prisma.job.create({
    data: {
      jobNumber: "J-2025-095",
      customerName: "Sunridge Aged Care",
      description: "Main switchboard upgrade & emergency lighting compliance",
      status: "IN_PROGRESS",
      quoteDate: daysAgo(55),
      startDate: daysAgo(40),
      expectedCompletionDate: daysFromNow(5),
      quoteAmount: 60000,
      budgetLabourHours: 320,
      budgetLabourCost: 23000,
      budgetMaterials: 19500,
      budgetSubcontractors: 4000,
      budgetOtherDirectCosts: 800,
      percentComplete: 80,
    },
  });
  await prisma.jobCostEntry.createMany({
    data: [
      { jobId: sunridge.id, date: daysAgo(35), category: "LABOUR", description: "Switchboard removal & install, weeks 1-3", hours: 210, amount: 15600 },
      { jobId: sunridge.id, date: daysAgo(8), category: "LABOUR", description: "Emergency lighting compliance, week 4", hours: 48, amount: 3550 },
      { jobId: sunridge.id, date: daysAgo(30), category: "MATERIALS", description: "Switchboard, breakers, emergency light fittings", amount: 18200 },
      { jobId: sunridge.id, date: daysAgo(20), category: "SUBCONTRACTOR", description: "Crane hire & rigging contractor", amount: 3600 },
      { jobId: sunridge.id, date: daysAgo(10), category: "OTHER", description: "Site induction & compliance fees", amount: 650 },
    ],
  });
  const sunridgeDeposit = await prisma.invoice.create({
    data: { jobId: sunridge.id, invoiceNumber: "INV-1080", type: "DEPOSIT", issueDate: daysAgo(52), dueDate: daysAgo(38), amount: 15000 },
  });
  const sunridgeProgress1 = await prisma.invoice.create({
    data: { jobId: sunridge.id, invoiceNumber: "INV-1095", type: "PROGRESS", issueDate: daysAgo(25), dueDate: daysAgo(11), amount: 25000 },
  });
  await prisma.payment.create({ data: { invoiceId: sunridgeDeposit.id, date: daysAgo(45), amount: 15000 } });
  await prisma.payment.create({ data: { invoiceId: sunridgeProgress1.id, date: daysAgo(20), amount: 15000 } });
  // sunridgeProgress1 left partially paid ($10,000 outstanding) and overdue.

  const franklin = await prisma.job.create({
    data: {
      jobNumber: "J-2025-101",
      customerName: "Franklin Street Units",
      description: "Common area lighting & power upgrade",
      status: "PAID",
      quoteDate: daysAgo(90),
      startDate: daysAgo(80),
      expectedCompletionDate: daysAgo(60),
      quoteAmount: 15000,
      budgetLabourHours: 90,
      budgetLabourCost: 6300,
      budgetMaterials: 4200,
      budgetSubcontractors: 0,
      budgetOtherDirectCosts: 200,
      percentComplete: 100,
    },
  });
  await prisma.jobCostEntry.createMany({
    data: [
      { jobId: franklin.id, date: daysAgo(75), category: "LABOUR", description: "Full job labour", hours: 86, amount: 6050 },
      { jobId: franklin.id, date: daysAgo(72), category: "MATERIALS", description: "LED fittings & cable", amount: 4050 },
      { jobId: franklin.id, date: daysAgo(65), category: "OTHER", description: "Disposal", amount: 150 },
    ],
  });
  const franklinFinal = await prisma.invoice.create({
    data: { jobId: franklin.id, invoiceNumber: "INV-1030", type: "FINAL", issueDate: daysAgo(62), dueDate: daysAgo(48), amount: 15000 },
  });
  await prisma.payment.create({ data: { invoiceId: franklinFinal.id, date: daysAgo(50), amount: 15000 } });

  await prisma.job.create({
    data: {
      jobNumber: "J-2025-140",
      customerName: "Bayview Retail",
      description: "Structured data cabling — 6 tenancies",
      status: "QUOTED",
      quoteDate: daysAgo(3),
      quoteAmount: 9000,
      budgetLabourHours: 55,
      budgetLabourCost: 3900,
      budgetMaterials: 2600,
      budgetSubcontractors: 0,
      budgetOtherDirectCosts: 100,
      percentComplete: 0,
    },
  });

  await prisma.job.create({
    data: {
      jobNumber: "J-2025-070",
      customerName: "Old Mill Estate",
      description: "Sub-division reticulation — lost to competitor",
      status: "LOST",
      quoteDate: daysAgo(45),
      quoteAmount: 27000,
      budgetLabourHours: 160,
      budgetLabourCost: 11500,
      budgetMaterials: 8200,
      budgetSubcontractors: 1200,
      budgetOtherDirectCosts: 300,
      percentComplete: 0,
    },
  });

  console.log("Jobs, costs, invoices & payments seeded.");

  await prisma.cashflowAdjustment.createMany({
    data: [
      { weekStarting: mondayOfWeek(1), direction: "OUT", category: "Compliance", description: "New apprentice PPE & tool kit", amount: 450 },
      { weekStarting: mondayOfWeek(2), direction: "OUT", category: "Tax", description: "BAS / GST payment", amount: 8500 },
      { weekStarting: mondayOfWeek(2), direction: "OUT", category: "Tax", description: "PAYG withholding payment", amount: 3200 },
      { weekStarting: mondayOfWeek(4), direction: "OUT", category: "Equipment", description: "New test equipment (calibration due)", amount: 1800 },
      { weekStarting: mondayOfWeek(7), direction: "OUT", category: "Vehicles", description: "Ute upgrade — trade-in shortfall", amount: 6000 },
      { weekStarting: mondayOfWeek(9), direction: "IN", category: "Other income", description: "Insurance claim payout — vehicle repair", amount: 2200 },
    ],
  });

  console.log("Cashflow adjustments seeded.");
  console.log(`Rossi (subcontractor) created with id ${rossi.id} — available for future job/labour allocation.`);
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
