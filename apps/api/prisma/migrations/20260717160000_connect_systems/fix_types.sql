-- Fix: FK columns must be TEXT, not UUID (ids are TEXT in this schema)

-- Fix ar_collection_actions.collectionCaseId: uuid -> text
ALTER TABLE ar_collection_actions DROP COLUMN IF EXISTS "collectionCaseId";
ALTER TABLE ar_collection_actions ADD COLUMN "collectionCaseId" TEXT;

-- Fix statements_of_account.leaseId: uuid -> text
ALTER TABLE statements_of_account DROP COLUMN IF EXISTS "leaseId";
ALTER TABLE statements_of_account ADD COLUMN "leaseId" TEXT;

-- Fix owner_pnl_statements.leaseId: uuid -> text
ALTER TABLE owner_pnl_statements DROP COLUMN IF EXISTS "leaseId";
ALTER TABLE owner_pnl_statements ADD COLUMN "leaseId" TEXT;

-- Fix document_vaults.leaseId: uuid -> text
ALTER TABLE document_vaults DROP COLUMN IF EXISTS "leaseId";
ALTER TABLE document_vaults ADD COLUMN "leaseId" TEXT;

-- Fix document_vaults.unitId: uuid -> text (propertyId is already text from earlier)
ALTER TABLE document_vaults DROP COLUMN IF EXISTS "unitId";
ALTER TABLE document_vaults ADD COLUMN "unitId" TEXT;

-- Fix property_images.propertyId: uuid -> text
ALTER TABLE property_images DROP COLUMN IF EXISTS "propertyId";
ALTER TABLE property_images ADD COLUMN "propertyId" TEXT NOT NULL;

-- Fix unit_images.unitId: uuid -> text
ALTER TABLE unit_images DROP COLUMN IF EXISTS "unitId";
ALTER TABLE unit_images ADD COLUMN "unitId" TEXT NOT NULL;

-- Now add FK constraints
ALTER TABLE ar_collection_actions ADD CONSTRAINT "ar_collection_actions_collectionCaseId_fkey"
  FOREIGN KEY ("collectionCaseId") REFERENCES collection_cases(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE statements_of_account ADD CONSTRAINT "statements_of_account_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE owner_pnl_statements ADD CONSTRAINT "owner_pnl_statements_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES units(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_leaseId_fkey"
  FOREIGN KEY ("leaseId") REFERENCES lease_agreements(id) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE property_images ADD CONSTRAINT "property_images_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE unit_images ADD CONSTRAINT "unit_images_unitId_fkey"
  FOREIGN KEY ("unitId") REFERENCES units(id) ON DELETE CASCADE ON UPDATE CASCADE;
