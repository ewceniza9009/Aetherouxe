/**
 * TEMP BACKFILL SCRIPT — NOT part of the app seed.
 *
 * Purpose: update EXISTING data in the running database without a full reseed.
 *   1. Rewrite every Project.description with elite marketing copy.
 *   2. Rewrite every Property description (stored in MongoDB property_specs.specs.description).
 *   3. Remove the em dash (—) from every Building.name, replacing it with " · ".
 *
 * Run with:
 *   DATABASE_URL=postgresql://...  MONGODB_URI=mongodb://...  npx ts-node apps/api/prisma/scripts/backfill-elite.ts
 *
 * Safe to run repeatedly (idempotent string transforms + deterministic copy).
 */
import { PrismaClient, PropertyType, type Project } from '@prisma/client';
import mongoose from 'mongoose';

const prisma = new PrismaClient();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/elite_realty';

const TYPE_LABEL: Record<string, string> = {
  condo_unit: 'condominium residence',
  house_and_lot: 'house-and-lot estate',
  townhouse: 'townhouse residence',
  commercial_space: 'commercial space',
  parking_slot: 'parking slot',
  high_rise: 'high-rise development',
  mid_rise: 'mid-rise development',
  village: 'master-planned village',
  commercial_complex: 'commercial complex',
};

function projectDescription(p: Project): string {
  const typeLabel = TYPE_LABEL[p.projectType] ?? 'development';
  const city =
    (p.address || 'a prime Philippine locale').split(',').slice(-1)[0]?.trim() ||
    'a prime Philippine locale';
  return `An address of distinction, ${p.name} is a ${typeLabel} poised in the heart of ${city}. Crafted for those who expect more, it pairs considered architecture with resort-grade amenities and the quiet confidence of a premier Philippine address — a landmark investment in modern living.`;
}

function propertyDescription(type: string | null | undefined, code: string): string {
  const typeLabel = TYPE_LABEL[type ?? ''] ?? 'residence';
  return `${code} is a meticulously presented ${typeLabel}, appointed for effortless everyday living. Bathed in natural light with refined finishes and intelligently zoned spaces, it offers the rare balance of privacy, comfort, and prestige that defines the Elite Realty collection.`;
}

async function main() {
  console.log('Connecting to databases...');
  await mongoose.connect(MONGO_URI);
  const specsCollection = mongoose.connection.collection('property_specs');

  /* ── 1. Projects: elite description ── */
  const projects = await prisma.project.findMany();
  let projUpdated = 0;
  for (const p of projects) {
    await prisma.project.update({
      where: { id: p.id },
      data: { description: projectDescription(p) },
    });
    projUpdated++;
  }
  console.log(`Projects updated: ${projUpdated}`);

  /* ── 2. Properties: elite description in MongoDB specs ── */
  const properties = await prisma.property.findMany({
    select: { id: true, propertyType: true, propertyCode: true },
  });
  let propUpdated = 0;
  for (const prop of properties) {
    const doc = await specsCollection.findOne({ propertyId: prop.id });
    const existingSpecs: Record<string, unknown> = (doc?.specs as Record<string, unknown>) ?? {};
    const nextSpecs = {
      ...existingSpecs,
      description: propertyDescription(prop.propertyType, prop.propertyCode),
    };
    await specsCollection.updateOne(
      { propertyId: prop.id },
      { $set: { specs: nextSpecs } },
      { upsert: true },
    );
    propUpdated++;
  }
  console.log(`Property descriptions updated: ${propUpdated}`);

  /* ── 3. Buildings: remove em dash from name ── */
  const buildings = await prisma.building.findMany();
  let bldUpdated = 0;
  for (const b of buildings) {
    if (b.name.includes('—')) {
      const next = b.name
        .replace(/—/g, '·')
        .replace(/\s+·\s+/g, ' · ')
        .replace(/\s{2,}/g, ' ')
        .trim();
      await prisma.building.update({ where: { id: b.id }, data: { name: next } });
      bldUpdated++;
    }
  }
  console.log(`Building names cleaned: ${bldUpdated}`);

  await mongoose.disconnect();
  console.log('Backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
