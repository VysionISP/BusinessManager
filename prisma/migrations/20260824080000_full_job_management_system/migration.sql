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
CREATE TABLE "Expense" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "customerType" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mainContactName" TEXT,
    "mainContactPhone" TEXT,
    "mainContactEmail" TEXT,
    "billingContactName" TEXT,
    "billingContactPhone" TEXT,
    "billingContactEmail" TEXT,
    "billingAddress" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "accountNumber" TEXT,
    "source" TEXT,
    "notes" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Site" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "accessInstructions" TEXT,
    "hoursNotes" TEXT,
    "hazardsNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Site_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "assetNumber" TEXT,
    "type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serialNumber" TEXT,
    "installedDate" DATETIME,
    "warrantyExpiry" DATETIME,
    "location" TEXT,
    "serviceIntervalMonths" INTEGER,
    "lastServiceDate" DATETIME,
    "nextServiceDate" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Asset_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Asset_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER,
    "siteId" INTEGER,
    "contactName" TEXT,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "source" TEXT,
    "workRequested" TEXT NOT NULL,
    "urgency" TEXT NOT NULL DEFAULT 'NORMAL',
    "preferredTime" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "estimatedValue" REAL,
    "assignedTo" TEXT,
    "followUpDate" DATETIME,
    "outcomeNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enquiry_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Enquiry_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "jobId" INTEGER,
    "title" TEXT NOT NULL,
    "customerReference" TEXT,
    "introduction" TEXT,
    "scopeOfWork" TEXT,
    "exclusions" TEXT,
    "termsAndConditions" TEXT,
    "issueDate" DATETIME,
    "expiryDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "acceptedByName" TEXT,
    "acceptedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "section" TEXT,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'item',
    "unitCost" REAL NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobNumber" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "enquiryId" INTEGER,
    "projectManagerId" INTEGER,
    "description" TEXT NOT NULL,
    "customerOrderNumber" TEXT,
    "pricingMethod" TEXT NOT NULL DEFAULT 'FIXED_PRICE',
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
    "retentionPercent" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "Enquiry" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Job_projectManagerId_fkey" FOREIGN KEY ("projectManagerId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobPhase" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "scheduledStart" DATETIME,
    "scheduledEnd" DATETIME,
    "budgetLabourHours" REAL NOT NULL DEFAULT 0,
    "budgetLabourCost" REAL NOT NULL DEFAULT 0,
    "budgetMaterials" REAL NOT NULL DEFAULT 0,
    "budgetSubcontractors" REAL NOT NULL DEFAULT 0,
    "budgetOtherDirectCosts" REAL NOT NULL DEFAULT 0,
    "percentComplete" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobPhase_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Variation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "variationNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "reason" TEXT,
    "requestedBy" TEXT,
    "requestDate" DATETIME,
    "labourAllowance" REAL NOT NULL DEFAULT 0,
    "materialAllowance" REAL NOT NULL DEFAULT 0,
    "subcontractorAllowance" REAL NOT NULL DEFAULT 0,
    "otherAllowance" REAL NOT NULL DEFAULT 0,
    "markupPercent" REAL NOT NULL DEFAULT 20,
    "sellPriceOverride" REAL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customerApproved" BOOLEAN NOT NULL DEFAULT false,
    "approvedDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Variation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobCostEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER NOT NULL,
    "phaseId" INTEGER,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hours" REAL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobCostEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobCostEntry_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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
CREATE TABLE "Supplier" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "paymentTermsDays" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "poNumber" TEXT NOT NULL,
    "supplierId" INTEGER NOT NULL,
    "jobId" INTEGER NOT NULL,
    "phaseId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "requestedBy" TEXT,
    "approvedBy" TEXT,
    "requiredDate" DATETIME,
    "deliveryAddress" TEXT,
    "instructions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PurchaseOrder_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "purchaseOrderId" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unitCost" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "PurchaseOrderLine_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SupplierInvoice" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "supplierId" INTEGER NOT NULL,
    "purchaseOrderId" INTEGER,
    "jobId" INTEGER NOT NULL,
    "phaseId" INTEGER,
    "invoiceNumber" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'MATERIALS',
    "date" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "jobCostEntryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SupplierInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SupplierInvoice_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupplierInvoice_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SupplierInvoice_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SupplierInvoice_jobCostEntryId_fkey" FOREIGN KEY ("jobCostEntryId") REFERENCES "JobCostEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isCertificate" BOOLEAN NOT NULL DEFAULT false,
    "fieldsJson" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "formTemplateId" INTEGER NOT NULL,
    "jobId" INTEGER,
    "phaseId" INTEGER,
    "submittedBy" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "answersJson" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    CONSTRAINT "FormSubmission_formTemplateId_fkey" FOREIGN KEY ("formTemplateId") REFERENCES "FormTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FormSubmission_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "jobId" INTEGER,
    "phaseId" INTEGER,
    "siteId" INTEGER,
    "employeeId" INTEGER,
    "eventType" TEXT NOT NULL DEFAULT 'WORK',
    "title" TEXT NOT NULL,
    "startAt" DATETIME NOT NULL,
    "endAt" DATETIME NOT NULL,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ScheduleEvent_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleEvent_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleEvent_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ScheduleEvent_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurringJobTemplate" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "customerId" INTEGER NOT NULL,
    "siteId" INTEGER,
    "name" TEXT NOT NULL,
    "frequencyMonths" INTEGER NOT NULL DEFAULT 12,
    "nextDueDate" DATETIME NOT NULL,
    "jobDescriptionTemplate" TEXT NOT NULL,
    "pricingMethod" TEXT NOT NULL DEFAULT 'FIXED_PRICE',
    "defaultQuoteAmount" REAL NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurringJobTemplate_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RecurringJobTemplate_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PayrollEntry_weekCommencing_idx" ON "PayrollEntry"("weekCommencing");

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_employeeId_weekCommencing_key" ON "PayrollEntry"("employeeId", "weekCommencing");

-- CreateIndex
CREATE INDEX "Expense_date_idx" ON "Expense"("date");

-- CreateIndex
CREATE INDEX "Site_customerId_idx" ON "Site"("customerId");

-- CreateIndex
CREATE INDEX "Asset_customerId_idx" ON "Asset"("customerId");

-- CreateIndex
CREATE INDEX "Asset_nextServiceDate_idx" ON "Asset"("nextServiceDate");

-- CreateIndex
CREATE INDEX "Enquiry_status_idx" ON "Enquiry"("status");

-- CreateIndex
CREATE INDEX "Quote_quoteNumber_idx" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "Quote_jobId_idx" ON "Quote"("jobId");

-- CreateIndex
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE INDEX "Job_customerId_idx" ON "Job"("customerId");

-- CreateIndex
CREATE INDEX "Job_status_idx" ON "Job"("status");

-- CreateIndex
CREATE INDEX "JobPhase_jobId_idx" ON "JobPhase"("jobId");

-- CreateIndex
CREATE INDEX "Variation_jobId_idx" ON "Variation"("jobId");

-- CreateIndex
CREATE INDEX "JobCostEntry_jobId_idx" ON "JobCostEntry"("jobId");

-- CreateIndex
CREATE INDEX "JobCostEntry_phaseId_idx" ON "JobCostEntry"("phaseId");

-- CreateIndex
CREATE INDEX "Invoice_jobId_idx" ON "Invoice"("jobId");

-- CreateIndex
CREATE INDEX "Payment_invoiceId_idx" ON "Payment"("invoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_poNumber_key" ON "PurchaseOrder"("poNumber");

-- CreateIndex
CREATE INDEX "PurchaseOrder_jobId_idx" ON "PurchaseOrder"("jobId");

-- CreateIndex
CREATE INDEX "PurchaseOrder_status_idx" ON "PurchaseOrder"("status");

-- CreateIndex
CREATE INDEX "PurchaseOrderLine_purchaseOrderId_idx" ON "PurchaseOrderLine"("purchaseOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierInvoice_jobCostEntryId_key" ON "SupplierInvoice"("jobCostEntryId");

-- CreateIndex
CREATE INDEX "SupplierInvoice_jobId_idx" ON "SupplierInvoice"("jobId");

-- CreateIndex
CREATE INDEX "FormSubmission_jobId_idx" ON "FormSubmission"("jobId");

-- CreateIndex
CREATE INDEX "FormSubmission_formTemplateId_idx" ON "FormSubmission"("formTemplateId");

-- CreateIndex
CREATE INDEX "ScheduleEvent_startAt_idx" ON "ScheduleEvent"("startAt");

-- CreateIndex
CREATE INDEX "ScheduleEvent_employeeId_idx" ON "ScheduleEvent"("employeeId");

-- CreateIndex
CREATE INDEX "RecurringJobTemplate_nextDueDate_idx" ON "RecurringJobTemplate"("nextDueDate");

-- CreateIndex
CREATE INDEX "CashflowAdjustment_weekStarting_idx" ON "CashflowAdjustment"("weekStarting");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

