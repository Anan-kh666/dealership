/*
  Warnings:

  - A unique constraint covering the columns `[referenceNumber]` on the table `FinanceApplication` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `addressCity` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressPostcode` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressState` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressStreet` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dateOfBirth` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `downPaymentPercent` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `employerName` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `estimatedMonthly` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `icNumber` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `interestRatePct` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `maritalStatus` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `position` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `referenceNumber` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenureYears` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehiclePrice` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.
  - Added the required column `yearsEmployed` to the `FinanceApplication` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FinanceApplication" ADD COLUMN     "addressCity" TEXT NOT NULL,
ADD COLUMN     "addressPostcode" TEXT NOT NULL,
ADD COLUMN     "addressState" TEXT NOT NULL,
ADD COLUMN     "addressStreet" TEXT NOT NULL,
ADD COLUMN     "bankStatementUrls" TEXT[],
ADD COLUMN     "dateOfBirth" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "documentsSkipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "downPaymentPercent" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "employerName" TEXT NOT NULL,
ADD COLUMN     "estimatedMonthly" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "icBackUrl" TEXT,
ADD COLUMN     "icFrontUrl" TEXT,
ADD COLUMN     "icNumber" TEXT NOT NULL,
ADD COLUMN     "interestRatePct" DECIMAL(5,2) NOT NULL,
ADD COLUMN     "maritalStatus" TEXT NOT NULL,
ADD COLUMN     "monthlyCommitments" DECIMAL(12,2),
ADD COLUMN     "nationality" TEXT NOT NULL,
ADD COLUMN     "payslipUrls" TEXT[],
ADD COLUMN     "position" TEXT NOT NULL,
ADD COLUMN     "referenceNumber" TEXT NOT NULL,
ADD COLUMN     "tenureYears" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "vehicleLabel" TEXT,
ADD COLUMN     "vehiclePrice" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "yearsEmployed" DECIMAL(5,2) NOT NULL,
ALTER COLUMN "monthlyIncome" SET DATA TYPE DECIMAL(12,2);

-- CreateIndex
CREATE UNIQUE INDEX "FinanceApplication_referenceNumber_key" ON "FinanceApplication"("referenceNumber");

-- CreateIndex
CREATE INDEX "FinanceApplication_status_createdAt_idx" ON "FinanceApplication"("status", "createdAt");
