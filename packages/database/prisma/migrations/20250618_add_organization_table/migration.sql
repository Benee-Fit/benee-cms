-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "websiteUrl" TEXT,
    "orgName" TEXT NOT NULL,
    "orgLogo" TEXT,
    "orgType" TEXT,
    "orgSize" TEXT,
    "orgEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkId_key" ON "Organization"("clerkId");

-- CreateIndex
CREATE INDEX "Organization_clerkId_idx" ON "Organization"("clerkId");

-- AddColumn to User table
ALTER TABLE "User" ADD COLUMN "orgId" TEXT;

-- CreateIndex on User.orgId
CREATE INDEX "User_orgId_idx" ON "User"("orgId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;