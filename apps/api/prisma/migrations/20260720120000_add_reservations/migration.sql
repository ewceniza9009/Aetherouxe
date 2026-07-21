-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('reserved', 'converted', 'expired', 'cancelled');

-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "schemeId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "prospectName" TEXT NOT NULL,
    "prospectContact" TEXT,
    "optionFeeAmount" DECIMAL(14,2),
    "holdingFeeCollected" BOOLEAN NOT NULL DEFAULT false,
    "holdDays" INTEGER NOT NULL DEFAULT 30,
    "holdExpiry" TIMESTAMP(3) NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'reserved',
    "convertedLeaseId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservations_unitId_idx" ON "reservations"("unitId");
CREATE INDEX "reservations_schemeId_idx" ON "reservations"("schemeId");
CREATE INDEX "reservations_tenantId_idx" ON "reservations"("tenantId");
CREATE INDEX "reservations_status_idx" ON "reservations"("status");
CREATE INDEX "reservations_holdExpiry_idx" ON "reservations"("holdExpiry");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_convertedLeaseId_fkey" FOREIGN KEY ("convertedLeaseId") REFERENCES "lease_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;
