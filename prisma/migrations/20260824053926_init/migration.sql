-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "businessName" TEXT NOT NULL DEFAULT 'Electrical Business Manager',
    "targetMarginPercent" REAL NOT NULL DEFAULT 20,
    "targetUtilisationPercent" REAL NOT NULL DEFAULT 75,
    "openingBankBalance" REAL NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "employeeType" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "payType" TEXT NOT NULL DEFAULT 'HOURLY',
    "baseHourlyRate" REAL NOT NULL DEFAULT 0,
    "annualSalary" REAL,
    "ordinaryHoursPerWeek" REAL NOT NULL DEFAULT 38,
    "overtimeHoursPerWeek" REAL NOT NULL DEFAULT 0,
    "overtimeMultiplier" REAL NOT NULL DEFAULT 1.5,
    "weeklyAllowances" REAL NOT NULL DEFAULT 0,
    "superRatePercent" REAL NOT NULL DEFAULT 11.5,
    "onCostPercent" REAL NOT NULL DEFAULT 15,
    "expectedBillableHoursPerWeek" REAL NOT NULL DEFAULT 32,
    "chargeOutRate" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "weekCommencing" DATETIME NOT NULL,
    "ordinaryHours" REAL NOT NULL DEFAULT 0,
    "overtimeHours" REAL NOT NULL DEFAULT 0,
    "allowances" REAL NOT NULL DEFAULT 0,
    "leaveHours" REAL NOT NULL DEFAULT 0,
    "sickHours" REAL NOT NULL DEFAULT 0,
    "nonBillableHours" REAL NOT NULL DEFAULT 0,
    "billableHours" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PayrollEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OverheadExpense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "frequency" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'LEAD',
    "quoteDate" DATETIME,
    "startDate" DATETIME,
    "expectedCompletionDate" DATETIME,
    "quoteAmount" REAL NOT NULL DEFAULT 0,
    "budgetLabourHours" REAL NOT NULL DEFAULT 0,
    "budgetLabourCost" REAL NOT NULL DEFAULT 0,
    "budgetMaterials" REAL NOT NULL DEFAULT 0,
    "budgetSubcontractors" REAL NOT NULL DEFAULT 0,
    "budgetOtherDirectCosts" REAL NOT NULL DEFAULT 0,
    "percentComplete" REAL NOT NULL DEFAULT 0,
    "targetMarginPercent" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "JobCostEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hours" REAL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobCostEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'PROGRESS',
    "issueDate" DATETIME NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Invoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "invoiceId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashflowAdjustment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "weekStarting" DATETIME NOT NULL,
    "direction" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PayrollEntry_weekCommencing_idx" ON "PayrollEntry"("weekCommencing");

-- CreateIndex
CREATE INDEX "PayrollEntry_employeeId_idx" ON "PayrollEntry"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE INDEX "JobCostEntry_jobId_idx" ON "JobCostEntry"("jobId");

-- CreateIndex
CREATE INDEX "Invoice_jobId_idx" ON "Invoice"("jobId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE INDEX "CashflowAdjustment_weekStarting_idx" ON "CashflowAdjustment"("weekStarting");
