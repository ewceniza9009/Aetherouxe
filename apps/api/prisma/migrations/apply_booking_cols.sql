DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='amenity_bookings' AND column_name='tenantName') THEN
    ALTER TABLE "amenity_bookings" ADD COLUMN "tenantName" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='amenity_bookings' AND column_name='unitLabel') THEN
    ALTER TABLE "amenity_bookings" ADD COLUMN "unitLabel" TEXT;
  END IF;
END $$;
