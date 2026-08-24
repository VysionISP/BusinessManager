-- CreateTable
CREATE TABLE "TimesheetEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employeeId" INTEGER NOT NULL,
    "jobId" INTEGER,
    "phaseId" INTEGER,
    "date" DATETIME NOT NULL,
    "hours" REAL NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'ORDINARY',
    "billable" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "costEntryId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimesheetEntry_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "JobPhase" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimesheetEntry_costEntryId_fkey" FOREIGN KEY ("costEntryId") REFERENCES "JobCostEntry" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TimesheetEntry_costEntryId_key" ON "TimesheetEntry"("costEntryId");

-- CreateIndex
CREATE INDEX "TimesheetEntry_employeeId_date_idx" ON "TimesheetEntry"("employeeId", "date");

-- CreateIndex
CREATE INDEX "TimesheetEntry_jobId_idx" ON "TimesheetEntry"("jobId");

-- CreateIndex
CREATE INDEX "TimesheetEntry_date_idx" ON "TimesheetEntry"("date");
