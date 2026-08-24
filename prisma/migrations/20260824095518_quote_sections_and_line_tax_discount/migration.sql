/*
  Warnings:

  - You are about to drop the column `section` on the `QuoteLine` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "QuoteSection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayMode" TEXT NOT NULL DEFAULT 'ITEMIZED',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteSection_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_QuoteLine" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "quoteId" INTEGER NOT NULL,
    "sectionId" INTEGER,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'item',
    "unitCost" REAL NOT NULL DEFAULT 0,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "taxPercent" REAL NOT NULL DEFAULT 0,
    "discountPercent" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "QuoteLine_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuoteLine_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "QuoteSection" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuoteLine" ("description", "id", "quantity", "quoteId", "sortOrder", "unit", "unitCost", "unitPrice") SELECT "description", "id", "quantity", "quoteId", "sortOrder", "unit", "unitCost", "unitPrice" FROM "QuoteLine";
DROP TABLE "QuoteLine";
ALTER TABLE "new_QuoteLine" RENAME TO "QuoteLine";
CREATE INDEX "QuoteLine_quoteId_idx" ON "QuoteLine"("quoteId");
CREATE INDEX "QuoteLine_sectionId_idx" ON "QuoteLine"("sectionId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "QuoteSection_quoteId_idx" ON "QuoteSection"("quoteId");
