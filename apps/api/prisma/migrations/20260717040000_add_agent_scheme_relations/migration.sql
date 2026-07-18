-- CreateEnum: SchemeType
CREATE TYPE "SchemeType" AS ENUM ('standard_rental', 'spot_cash', 'installment', 'mortgage_assisted', 'rent_to_own');

-- CreateTable: schemes (was missing from the migration chain; the FK below depends on it)
CREATE TABLE "schemes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT,
    "schemeType" "SchemeType" NOT NULL,
    "remarks" TEXT,
    "projectId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    -- Standard Rental
    "securityDepositPercent" DECIMAL(8,4),
    "penaltyPercent" DECIMAL(8,4),
    "graceDays" INTEGER,

    -- Spot Cash
    "discountPercent" DECIMAL(8,4),

    -- Installment (DP / Equity / Balance)
    "dpNumberOfPayments" INTEGER,
    "dpNumberOfDaysFromDp" INTEGER,
    "dpAmount" DECIMAL(12,2),
    "dpRemarks" TEXT,
    "eqNumberOfPayments" INTEGER,
    "eqNumberOfDaysFromDp" INTEGER,
    "eqAmount" DECIMAL(12,2),
    "eqPaymentPercentage" DECIMAL(8,4),
    "eqDownpaymentPercentage" DECIMAL(8,4),
    "eqMonthlyAmortPercentage" DECIMAL(8,4),
    "eqDiscountPercentage" DECIMAL(8,4),
    "eqPaymentOrderNumber" INTEGER,
    "eqRemarks" TEXT,
    "blNumberOfPayments" INTEGER,
    "blNumberOfDaysFromDp" INTEGER,
    "blAmount" DECIMAL(12,2),
    "blPaymentPercentage" DECIMAL(8,4),
    "blMiscPercentage" DECIMAL(8,4),
    "blIsChangeOrder" BOOLEAN NOT NULL DEFAULT false,
    "blIncludeDpAmort" BOOLEAN NOT NULL DEFAULT false,
    "blRemarks" TEXT,

    -- Mortgage Assisted
    "mortgageDownPaymentPercent" DECIMAL(8,4),
    "interestRatePercent" DECIMAL(8,4),
    "loanTermMonths" INTEGER,

    -- Rent-to-Own
    "optionFeePercent" DECIMAL(8,4),
    "equityAccumulationPercent" DECIMAL(8,4),
    "targetPurchaseYears" INTEGER,

    -- Commissions (all sale types)
    "agentCommissionPercentage" DECIMAL(8,4),
    "companyCommissionPercentage" DECIMAL(8,4),

    CONSTRAINT "schemes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schemes_code_key" ON "schemes"("code");

-- AddForeignKey: schemes -> projects
ALTER TABLE "schemes" ADD CONSTRAINT "schemes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable: Add agentId and schemeId columns, then FK constraints
ALTER TABLE "lease_agreements" ADD COLUMN "agentId" TEXT;
ALTER TABLE "lease_agreements" ADD COLUMN "schemeId" TEXT;
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "real_estate_agents"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON UPDATE CASCADE ON DELETE SET NULL;
