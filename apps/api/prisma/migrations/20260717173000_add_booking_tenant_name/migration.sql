ALTER TABLE "amenity_bookings" ADD COLUMN "tenantName" TEXT;
ALTER TABLE "amenity_bookings" ADD COLUMN "unitLabel" TEXT;

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "rolled_back_at", "started_at", "applied_steps_count")
VALUES ('add_booking_tenant_name', 'manual', NOW(), '20260717173000_add_booking_tenant_name', NULL, NOW(), 1)
ON CONFLICT DO NOTHING;
