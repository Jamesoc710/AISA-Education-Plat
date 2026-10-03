-- Recap editions (2026-10-03): one edition can cover several weeks. Additive
-- and nullable, so it is safe to apply before the code that reads it deploys.

-- AlterTable
ALTER TABLE "digest_editions" ADD COLUMN "periodEnd" TIMESTAMP(3);
