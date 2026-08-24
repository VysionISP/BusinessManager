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

  await prisma.formSubmission.deleteMany();
  await prisma.formTemplate.deleteMany();
  await prisma.scheduleEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.supplierInvoice.deleteMany();
  await prisma.purchaseOrderLine.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.supplier.deleteMany();
  await prisma.variation.deleteMany();
  await prisma.jobCostEntry.deleteMany();
  await prisma.jobPhase.deleteMany();
  await prisma.quoteLine.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.job.deleteMany();
  await prisma.enquiry.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.recurringJobTemplate.deleteMany();
  await prisma.site.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.payrollEntry.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.overheadExpense.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.cashflowAdjustment.deleteMany();
  await prisma.auditLog.deleteMany();
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

  const overheads: { category: string; name: string; amount: number; frequency: string }[] = [
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

  await prisma.expense.createMany({
    data: [
      { date: daysAgo(18), category: "TOOLS_EQUIPMENT", description: "Replacement drill set", amount: 420 },
      { date: daysAgo(12), category: "VEHICLES", description: "Extra fuel — Sunridge site visits", amount: 180 },
      { date: daysAgo(5), category: "ADMINISTRATION", description: "Courier — urgent parts delivery", amount: 65 },
    ],
  });

  console.log("Overheads & expenses seeded.");

  // ---------------------------------------------------------------------
  // Customers & sites
  // ---------------------------------------------------------------------

  const meadowbankCustomer = await prisma.customer.create({
    data: { name: "Meadowbank Shopping Centre", customerType: "COMMERCIAL", mainContactName: "Centre Management", mainContactPhone: "03 5555 0101", paymentTermsDays: 30 },
  });
  const meadowbankSite = await prisma.site.create({
    data: { customerId: meadowbankCustomer.id, name: "Meadowbank Shopping Centre", address: "88 Centre Rd, Cranbourne VIC", accessInstructions: "Loading dock, sign in at centre management office", hoursNotes: "Trading hours 9am-6pm, after-hours access via security" },
  });

  const nguyenCustomer = await prisma.customer.create({
    data: { name: "Nguyen Residence", customerType: "RESIDENTIAL", mainContactName: "Minh Nguyen", mainContactPhone: "0412 345 678", mainContactEmail: "minh.nguyen@example.com" },
  });
  const nguyenSite = await prisma.site.create({
    data: { customerId: nguyenCustomer.id, name: "Nguyen Residence", address: "14 Wattle St, Berwick VIC" },
  });

  const harborviewCustomer = await prisma.customer.create({
    data: { name: "Harborview Cafe", customerType: "COMMERCIAL", mainContactName: "Elena Harbord", mainContactPhone: "0423 111 222" },
  });
  const harborviewSite = await prisma.site.create({
    data: { customerId: harborviewCustomer.id, name: "Harborview Cafe", address: "3/22 Esplanade, Frankston VIC", accessInstructions: "Deliveries via rear laneway" },
  });

  const sunridgeCustomer = await prisma.customer.create({
    data: { name: "Sunridge Aged Care", customerType: "COMMERCIAL", mainContactName: "Facilities Manager", mainContactPhone: "03 5555 0199", paymentTermsDays: 30 },
  });
  const sunridgeSite = await prisma.site.create({
    data: {
      customerId: sunridgeCustomer.id,
      name: "Sunridge Aged Care",
      address: "120 Ridge Rd, Pakenham VIC",
      accessInstructions: "Sign in at reception, induction required for all trades",
      hazardsNotes: "Live residents on site — noise restrictions 10am-4pm",
    },
  });

  const franklinCustomer = await prisma.customer.create({
    data: { name: "Franklin Street Body Corporate", customerType: "PROPERTY_MANAGER", mainContactName: "Strata Manager", paymentTermsDays: 30 },
  });
  const franklinSite = await prisma.site.create({
    data: { customerId: franklinCustomer.id, name: "Franklin Street Units", address: "5 Franklin St, Dandenong VIC" },
  });

  const bayviewCustomer = await prisma.customer.create({
    data: { name: "Bayview Retail Group", customerType: "COMMERCIAL", mainContactName: "Leasing Manager" },
  });

  const oldMillCustomer = await prisma.customer.create({
    data: { name: "Old Mill Estate Developments", customerType: "BUILDER", mainContactName: "Site Supervisor" },
  });

  console.log("Customers & sites seeded.");

  // ---------------------------------------------------------------------
  // Jobs — deliberately span the full status range and include a job
  // that's over budget/below target margin and one with an overdue
  // invoice, so the dashboard and alerts have something real to show.
  // ---------------------------------------------------------------------

  const meadowbank = await prisma.job.create({
    data: {
      jobNumber: "J-2025-041",
      customerId: meadowbankCustomer.id,
      siteId: meadowbankSite.id,
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
      customerId: nguyenCustomer.id,
      siteId: nguyenSite.id,
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
  await prisma.variation.create({
    data: {
      jobId: nguyen.id,
      variationNumber: "V-1",
      title: "Additional power circuit — home office",
      scope: "Customer requested an additional double GPO circuit to the new home office after rough-in was complete.",
      reason: "Customer request",
      requestedBy: "Minh Nguyen",
      requestDate: daysAgo(10),
      labourAllowance: 350,
      materialAllowance: 120,
      markupPercent: 20,
      status: "APPROVED",
      customerApproved: true,
      approvedDate: daysAgo(9),
    },
  });

  const harborview = await prisma.job.create({
    data: {
      jobNumber: "J-2025-122",
      customerId: harborviewCustomer.id,
      siteId: harborviewSite.id,
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
      customerId: sunridgeCustomer.id,
      siteId: sunridgeSite.id,
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
      projectManagerId: dave.id,
    },
  });

  const switchboardPhase = await prisma.jobPhase.create({
    data: {
      jobId: sunridge.id,
      name: "Phase A — Switchboard replacement",
      description: "Removal of old main switchboard and install of new distribution board",
      sortOrder: 0,
      status: "COMPLETE",
      budgetLabourHours: 210,
      budgetLabourCost: 15600,
      budgetMaterials: 14000,
      budgetSubcontractors: 3600,
      percentComplete: 100,
    },
  });
  const emergencyLightingPhase = await prisma.jobPhase.create({
    data: {
      jobId: sunridge.id,
      name: "Phase B — Emergency lighting compliance",
      description: "Testing and replacement of non-compliant emergency light fittings",
      sortOrder: 1,
      status: "IN_PROGRESS",
      budgetLabourHours: 110,
      budgetLabourCost: 7400,
      budgetMaterials: 5500,
      budgetSubcontractors: 400,
      percentComplete: 60,
    },
  });

  await prisma.jobCostEntry.createMany({
    data: [
      { jobId: sunridge.id, phaseId: switchboardPhase.id, date: daysAgo(35), category: "LABOUR", description: "Switchboard removal & install, weeks 1-3", hours: 210, amount: 15600 },
      { jobId: sunridge.id, phaseId: emergencyLightingPhase.id, date: daysAgo(8), category: "LABOUR", description: "Emergency lighting compliance, week 4", hours: 48, amount: 3550 },
      { jobId: sunridge.id, phaseId: switchboardPhase.id, date: daysAgo(30), category: "MATERIALS", description: "Switchboard, breakers", amount: 14200 },
      { jobId: sunridge.id, phaseId: emergencyLightingPhase.id, date: daysAgo(9), category: "MATERIALS", description: "Emergency light fittings", amount: 4000 },
      { jobId: sunridge.id, phaseId: switchboardPhase.id, date: daysAgo(20), category: "SUBCONTRACTOR", description: "Crane hire & rigging contractor", amount: 3600 },
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
      customerId: franklinCustomer.id,
      siteId: franklinSite.id,
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
      customerId: bayviewCustomer.id,
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
      customerId: oldMillCustomer.id,
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

  console.log("Jobs, phases, costs, invoices, payments & a variation seeded.");

  // ---------------------------------------------------------------------
  // Suppliers & purchasing — one open PO (committed cost) and one closed
  // PO with a matching supplier invoice (actual cost), so the difference
  // between committed and actual is visible on a real job.
  // ---------------------------------------------------------------------

  const cableSupplier = await prisma.supplier.create({
    data: { name: "Southern Cable & Switchgear", contactName: "Accounts", phone: "03 5555 0300", paymentTermsDays: 30 },
  });
  const hireSupplier = await prisma.supplier.create({
    data: { name: "Metro Equipment Hire", contactName: "Bookings", phone: "03 5555 0450", paymentTermsDays: 14 },
  });

  const openPo = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2025-014",
      supplierId: hireSupplier.id,
      jobId: harborview.id,
      status: "SENT",
      requestedBy: "Dave Mitchell",
      requiredDate: daysFromNow(5),
      lines: { create: [{ description: "Scissor lift hire — 2 weeks", quantity: 1, unitCost: 950 }] },
    },
  });

  const closedPo = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2025-009",
      supplierId: cableSupplier.id,
      jobId: sunridge.id,
      phaseId: switchboardPhase.id,
      status: "CLOSED",
      requestedBy: "Dave Mitchell",
      approvedBy: "Grace Whelan",
      lines: { create: [{ description: "Main switchboard & breakers", quantity: 1, unitCost: 14200 }] },
    },
  });

  await prisma.supplierInvoice.create({
    data: {
      supplierId: cableSupplier.id,
      purchaseOrderId: closedPo.id,
      jobId: sunridge.id,
      phaseId: switchboardPhase.id,
      invoiceNumber: "SC-88213",
      category: "MATERIALS",
      date: daysAgo(31),
      dueDate: daysAgo(1),
      amount: 14200,
      status: "PAID",
    },
  });

  console.log(`Suppliers & purchase orders seeded (open PO ${openPo.poNumber}, closed PO ${closedPo.poNumber}).`);

  // ---------------------------------------------------------------------
  // Sales pipeline — enquiries waiting to be quoted
  // ---------------------------------------------------------------------

  await prisma.enquiry.createMany({
    data: [
      {
        customerId: bayviewCustomer.id,
        workRequested: "LED upgrade for 3 additional tenancies",
        source: "Repeat customer",
        urgency: "NORMAL",
        status: "READY_TO_QUOTE",
        estimatedValue: 6500,
        assignedTo: "Dave Mitchell",
        followUpDate: daysFromNow(3),
      },
    ],
  });
  await prisma.enquiry.create({
    data: {
      contactName: "Priya Shah",
      contactPhone: "0433 222 111",
      workRequested: "Switchboard safety inspection before house sale",
      source: "Google",
      urgency: "HIGH",
      status: "NEW",
      followUpDate: daysFromNow(1),
    },
  });

  console.log("Enquiries seeded.");

  await prisma.formTemplate.createMany({
    data: [
      {
        name: "Take 5",
        description: "Quick pre-start hazard check",
        isCertificate: false,
        fieldsJson: JSON.stringify([
          { id: "f0", label: "Task being performed", type: "TEXT", required: true },
          { id: "f1", label: "Hazards identified", type: "LONG_TEXT", required: true },
          { id: "f2", label: "Controls in place", type: "LONG_TEXT", required: true },
          { id: "f3", label: "Safe to proceed?", type: "YES_NO", required: true },
          { id: "f4", label: "Worker signature", type: "SIGNATURE", required: true },
        ]),
      },
      {
        name: "RCD Test",
        description: "Residual current device test record",
        isCertificate: true,
        fieldsJson: JSON.stringify([
          { id: "f0", label: "RCD location", type: "TEXT", required: true },
          { id: "f1", label: "Trip time (ms)", type: "NUMBER", required: true },
          { id: "f2", label: "Result", type: "DROPDOWN", options: ["Pass", "Fail"], required: true },
          { id: "f3", label: "Licensed electrical worker", type: "TEXT", required: true },
          { id: "f4", label: "Licence number", type: "TEXT", required: true },
          { id: "f5", label: "Signature", type: "SIGNATURE", required: true },
        ]),
      },
      {
        name: "Customer completion sign-off",
        description: "Customer confirms work is complete and satisfactory",
        isCertificate: false,
        fieldsJson: JSON.stringify([
          { id: "f0", label: "Work completed as described?", type: "YES_NO", required: true },
          { id: "f1", label: "Comments", type: "LONG_TEXT" },
          { id: "f2", label: "Customer name", type: "TEXT", required: true },
          { id: "f3", label: "Customer signature", type: "SIGNATURE", required: true },
        ]),
      },
    ],
  });

  console.log("Form templates seeded.");

  await prisma.asset.createMany({
    data: [
      {
        customerId: sunridgeCustomer.id,
        siteId: sunridgeSite.id,
        type: "Emergency Light",
        location: "Main corridor, Level 1",
        serviceIntervalMonths: 6,
        lastServiceDate: daysAgo(180),
        nextServiceDate: daysFromNow(5),
      },
      {
        customerId: meadowbankCustomer.id,
        siteId: meadowbankSite.id,
        type: "Switchboard",
        location: "Main switch room",
        manufacturer: "Schneider",
        serviceIntervalMonths: 12,
        lastServiceDate: daysAgo(340),
        nextServiceDate: daysFromNow(25),
      },
    ],
  });

  await prisma.recurringJobTemplate.create({
    data: {
      customerId: sunridgeCustomer.id,
      siteId: sunridgeSite.id,
      name: "6-monthly emergency light test",
      frequencyMonths: 6,
      nextDueDate: daysFromNow(5),
      jobDescriptionTemplate: "Emergency lighting test & compliance certificate",
      pricingMethod: "FIXED_PRICE",
      defaultQuoteAmount: 850,
    },
  });

  console.log("Assets & recurring job templates seeded.");

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
