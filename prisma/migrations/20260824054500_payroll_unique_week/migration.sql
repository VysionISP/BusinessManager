-- DropIndex
DROP INDEX "PayrollEntry_employeeId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "PayrollEntry_employeeId_weekCommencing_key" ON "PayrollEntry"("employeeId", "weekCommencing");
