-- Migration: Connect all systems
-- Adds missing FK relations, Unit status, PropertyImage, UnitImage

-- 1. Add UnitStatus enum
DO $$ BEGIN
  CREATE TYPE "UnitStatus" AS ENUM ('available','occupied','reserved','under_maintenance','rented','rto_active');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add status column to units
ALTER TABLE units ADD COLUMN IF NOT EXISTS "status" "UnitStatus" DEFAULT 'available';
UPDATE units SET "status" = 'available' WHERE "status" IS NULL;

-- 3. Add FK columns to service_requests (Prisma manages these as nullable FKs)
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "tenantId" UUID;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "unitId" UUID;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS "propertyId" UUID;

-- 4. Add FK columns to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS "propertyId" UUID;
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS "authorId" UUID;

-- 5. Add FK columns to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "userId" UUID;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS "tenantId" UUID;

-- 6. Add collectionCaseId to ar_collection_actions
ALTER TABLE ar_collection_actions ADD COLUMN IF NOT EXISTS "collectionCaseId" UUID;

-- 7. Add leaseId to statements_of_account
ALTER TABLE statements_of_account ADD COLUMN IF NOT EXISTS "leaseId" UUID;

-- 8. Add leaseId to owner_pnl_statements
ALTER TABLE owner_pnl_statements ADD COLUMN IF NOT EXISTS "leaseId" UUID;

-- 9. Add propertyId, unitId, leaseId to document_vaults
ALTER TABLE document_vaults ADD COLUMN IF NOT EXISTS "propertyId" UUID;
ALTER TABLE document_vaults ADD COLUMN IF NOT EXISTS "unitId" UUID;
ALTER TABLE document_vaults ADD COLUMN IF NOT EXISTS "leaseId" UUID;

-- 10. Create property_images table
CREATE TABLE IF NOT EXISTS "property_images" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "propertyId" UUID NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. Create unit_images table
CREATE TABLE IF NOT EXISTS "unit_images" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  "unitId" UUID NOT NULL,
  url TEXT NOT NULL,
  alt TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Add foreign keys for service_requests
DO $$ BEGIN
  ALTER TABLE service_requests ADD CONSTRAINT "service_requests_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE service_requests ADD CONSTRAINT "service_requests_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE service_requests ADD CONSTRAINT "service_requests_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 13. Add foreign keys for community_posts
DO $$ BEGIN
  ALTER TABLE community_posts ADD CONSTRAINT "community_posts_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE community_posts ADD CONSTRAINT "community_posts_authorId_fkey"
    FOREIGN KEY ("authorId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 14. Add foreign keys for notifications
DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT "notifications_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE notifications ADD CONSTRAINT "notifications_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES tenants(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 15. Add foreign key for ar_collection_actions → collection_cases
DO $$ BEGIN
  ALTER TABLE ar_collection_actions ADD CONSTRAINT "ar_collection_actions_collectionCaseId_fkey"
    FOREIGN KEY ("collectionCaseId") REFERENCES collection_cases(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 16. Add foreign keys for statements_of_account
DO $$ BEGIN
  ALTER TABLE statements_of_account ADD CONSTRAINT "statements_of_account_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 17. Add foreign key for owner_pnl_statements
DO $$ BEGIN
  ALTER TABLE owner_pnl_statements ADD CONSTRAINT "owner_pnl_statements_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 18. Add foreign keys for document_vaults
DO $$ BEGIN
  ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_leaseId_fkey"
    FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 19. Add foreign keys for property_images
DO $$ BEGIN
  ALTER TABLE property_images ADD CONSTRAINT "property_images_propertyId_fkey"
    FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 20. Add foreign keys for unit_images
DO $$ BEGIN
  ALTER TABLE unit_images ADD CONSTRAINT "unit_images_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 21. Create indexes
CREATE INDEX IF NOT EXISTS "idx_service_requests_propertyId" ON service_requests("propertyId");
CREATE INDEX IF NOT EXISTS "idx_service_requests_unitId" ON service_requests("unitId");
CREATE INDEX IF NOT EXISTS "idx_service_requests_tenantId" ON service_requests("tenantId");
CREATE INDEX IF NOT EXISTS "idx_community_posts_propertyId" ON community_posts("propertyId");
CREATE INDEX IF NOT EXISTS "idx_notifications_userId" ON notifications("userId");
CREATE INDEX IF NOT EXISTS "idx_notifications_tenantId" ON notifications("tenantId");
CREATE INDEX IF NOT EXISTS "idx_document_vaults_propertyId" ON document_vaults("propertyId");
CREATE INDEX IF NOT EXISTS "idx_document_vaults_unitId" ON document_vaults("unitId");
CREATE INDEX IF NOT EXISTS "idx_document_vaults_leaseId" ON document_vaults("leaseId");
CREATE INDEX IF NOT EXISTS "idx_property_images_propertyId" ON property_images("propertyId");
CREATE INDEX IF NOT EXISTS "idx_unit_images_unitId" ON unit_images("unitId");
CREATE INDEX IF NOT EXISTS "idx_ar_collection_actions_collectionCaseId" ON ar_collection_actions("collectionCaseId");
CREATE INDEX IF NOT EXISTS "idx_statements_of_account_leaseId" ON statements_of_account("leaseId");
CREATE INDEX IF NOT EXISTS "idx_owner_pnl_statements_leaseId" ON owner_pnl_statements("leaseId");
