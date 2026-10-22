-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('queued', 'running', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "FindingImpact" AS ENUM ('minor', 'moderate', 'serious', 'critical');

-- CreateTable
CREATE TABLE "Scan" (
    "id" UUID NOT NULL,
    "url" VARCHAR(2048) NOT NULL,
    "normalizedUrl" VARCHAR(2048) NOT NULL,
    "status" "ScanStatus" NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "startedAt" TIMESTAMPTZ(3),
    "finishedAt" TIMESTAMPTZ(3),
    "errorCode" VARCHAR(64),
    "errorSummary" VARCHAR(500),

    CONSTRAINT "Scan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Finding" (
    "id" UUID NOT NULL,
    "scanId" UUID NOT NULL,
    "ruleId" VARCHAR(128) NOT NULL,
    "impact" "FindingImpact",
    "description" VARCHAR(4000) NOT NULL,
    "help" VARCHAR(2000) NOT NULL,
    "helpUrl" VARCHAR(2048) NOT NULL,
    "wcagTags" TEXT[],
    "targetSelectors" TEXT[],
    "sanitizedHtml" VARCHAR(10000),
    "failureSummary" VARCHAR(4000),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Finding_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scan_status_createdAt_idx" ON "Scan"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Scan_createdAt_id_idx" ON "Scan"("createdAt" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "Finding_scanId_impact_idx" ON "Finding"("scanId", "impact");

-- CreateIndex
CREATE INDEX "Finding_scanId_ruleId_idx" ON "Finding"("scanId", "ruleId");

-- AddForeignKey
ALTER TABLE "Finding" ADD CONSTRAINT "Finding_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "Scan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
