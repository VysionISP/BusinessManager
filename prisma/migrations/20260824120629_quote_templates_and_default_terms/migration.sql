-- AlterTable
ALTER TABLE "Settings" ADD COLUMN "defaultQuoteIntroduction" TEXT;
ALTER TABLE "Settings" ADD COLUMN "defaultQuoteTerms" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Quote" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "customerId" INTEGER,
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
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("acceptedByName", "acceptedDate", "createdAt", "customerId", "customerReference", "exclusions", "expiryDate", "id", "introduction", "issueDate", "jobId", "quoteNumber", "scopeOfWork", "siteId", "status", "termsAndConditions", "title", "version") SELECT "acceptedByName", "acceptedDate", "createdAt", "customerId", "customerReference", "exclusions", "expiryDate", "id", "introduction", "issueDate", "jobId", "quoteNumber", "scopeOfWork", "siteId", "status", "termsAndConditions", "title", "version" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
CREATE INDEX "Quote_quoteNumber_idx" ON "Quote"("quoteNumber");
CREATE INDEX "Quote_jobId_idx" ON "Quote"("jobId");
CREATE INDEX "Quote_isTemplate_idx" ON "Quote"("isTemplate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
