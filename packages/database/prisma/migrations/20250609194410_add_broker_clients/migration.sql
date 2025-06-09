-- CreateTable
CREATE TABLE "BrokerClient" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "policyNumber" TEXT NOT NULL,
    "renewalDate" TIMESTAMP(3) NOT NULL,
    "headcount" INTEGER NOT NULL,
    "premium" DECIMAL(10,2) NOT NULL,
    "revenue" DECIMAL(10,2) NOT NULL,
    "industry" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrokerClientDocument" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BrokerClientDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrokerClient_policyNumber_key" ON "BrokerClient"("policyNumber");

-- CreateIndex
CREATE INDEX "BrokerClient_policyNumber_idx" ON "BrokerClient"("policyNumber");

-- CreateIndex
CREATE INDEX "BrokerClient_renewalDate_idx" ON "BrokerClient"("renewalDate");

-- CreateIndex
CREATE INDEX "BrokerClientDocument_clientId_idx" ON "BrokerClientDocument"("clientId");
