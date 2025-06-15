-- CreateEnum
CREATE TYPE "InsightCategory" AS ENUM ('METRIC', 'REVENUE', 'RISK', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "ClientInsightData" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "category" "InsightCategory" NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "value" JSONB NOT NULL,
    "metadata" JSONB,
    "period" TEXT,
    "targetValue" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClientInsightData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClientTimeSeries" (
    "id" TEXT NOT NULL,
    "insightId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "value" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientTimeSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClientInsightData_clientId_idx" ON "ClientInsightData"("clientId");

-- CreateIndex
CREATE INDEX "ClientInsightData_brokerId_idx" ON "ClientInsightData"("brokerId");

-- CreateIndex
CREATE INDEX "ClientInsightData_category_idx" ON "ClientInsightData"("category");

-- CreateIndex
CREATE INDEX "ClientInsightData_type_idx" ON "ClientInsightData"("type");

-- CreateIndex
CREATE INDEX "ClientInsightData_period_idx" ON "ClientInsightData"("period");

-- CreateIndex
CREATE INDEX "ClientTimeSeries_insightId_idx" ON "ClientTimeSeries"("insightId");

-- CreateIndex
CREATE INDEX "ClientTimeSeries_date_idx" ON "ClientTimeSeries"("date");

-- CreateIndex
CREATE INDEX "ClientTimeSeries_insightId_date_idx" ON "ClientTimeSeries"("insightId", "date");