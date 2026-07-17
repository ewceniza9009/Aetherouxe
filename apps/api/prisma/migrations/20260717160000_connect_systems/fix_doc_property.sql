ALTER TABLE document_vaults DROP COLUMN "propertyId";
ALTER TABLE document_vaults ADD COLUMN "propertyId" TEXT;
ALTER TABLE document_vaults ADD CONSTRAINT "document_vaults_propertyId_fkey"
  FOREIGN KEY ("propertyId") REFERENCES properties(id) ON DELETE SET NULL ON UPDATE CASCADE;
