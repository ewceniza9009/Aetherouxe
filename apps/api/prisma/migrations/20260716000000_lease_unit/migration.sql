-- Add unit relation to lease_agreements
ALTER TABLE "lease_agreements" ADD COLUMN "unitId" TEXT;
ALTER TABLE "lease_agreements" ADD COLUMN "unitLabel" TEXT;
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;
