SELECT 'property_images' as tbl, count(*) as cnt FROM property_images
UNION ALL SELECT 'unit_images', count(*) FROM unit_images
UNION ALL SELECT 'units_occupied', count(*) FROM units WHERE status='occupied'
UNION ALL SELECT 'units_rto', count(*) FROM units WHERE status='rto_active'
UNION ALL SELECT 'units_available', count(*) FROM units WHERE status='available'
UNION ALL SELECT 'docs_with_property', count(*) FROM document_vaults WHERE "propertyId" IS NOT NULL
UNION ALL SELECT 'docs_with_lease', count(*) FROM document_vaults WHERE "leaseId" IS NOT NULL
UNION ALL SELECT 'stmts_with_lease', count(*) FROM statements_of_account WHERE "leaseId" IS NOT NULL
UNION ALL SELECT 'svc_with_property', count(*) FROM service_requests WHERE "propertyId" IS NOT NULL
UNION ALL SELECT 'svc_with_unit', count(*) FROM service_requests WHERE "unitId" IS NOT NULL
UNION ALL SELECT 'collections_with_lease', count(*) FROM collection_cases WHERE "leaseId" IS NOT NULL;
