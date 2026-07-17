-- AlterTable: Add agentId column and schemeId FK constraint
ALTER TABLE "lease_agreements" ADD COLUMN "agentId" TEXT;
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "real_estate_agents"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "schemes"("id") ON UPDATE CASCADE ON DELETE SET NULL;
