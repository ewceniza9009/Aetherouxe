import { PrismaClient, UserType, PropertyType, PropertyStatus, BuildingType, UnitType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const tenant = await prisma.tenant.upsert({
    where: { domain: 'ayala-land-premier' },
    update: {},
    create: {
      name: 'Ayala Land Premier',
      domain: 'ayala-land-premier',
      settings: {
        logo: null,
        timezone: 'Asia/Manila',
        currency: 'PHP',
        dateFormat: 'YYYY-MM-DD',
      },
    },
  });
  console.log(`Tenant created: ${tenant.name}`);

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elite-realty.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@elite-realty.com',
      passwordHash,
      userType: UserType.super_admin,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+639170000000',
    },
  });
  console.log(`Admin user created: ${admin.email}`);

  const property = await prisma.property.upsert({
    where: { propertyCode: 'ALP-PRK-001' },
    update: {},
    create: {
      tenantId: tenant.id,
      propertyCode: 'ALP-PRK-001',
      propertyType: PropertyType.condo_unit,
      status: PropertyStatus.available,
    },
  });

  const building = await prisma.building.create({
    data: {
      tenantId: tenant.id,
      name: 'Park Place Tower',
      buildingType: BuildingType.tower,
      floorCount: 20,
      unitCount: 80,
      address: '123 Ayala Avenue, Makati City',
    },
  });

  const floors: { id: string; buildingId: string; floorNumber: string; sortOrder: number }[] = [];
  for (let i = 1; i <= 5; i++) {
    const floor = await prisma.floor.create({
      data: {
        buildingId: building.id,
        floorNumber: `${i}${getOrdinalSuffix(i)} Floor`,
        sortOrder: i,
      },
    });
    floors.push(floor);
  }

  const unitTypes = [UnitType.studio, UnitType.one_br, UnitType.two_br, UnitType.three_br];
  const unitSuffixes = ['A', 'B', 'C', 'D'];
  let unitIndex = 0;

  for (const floor of floors) {
    for (const suffix of unitSuffixes) {
      const unitType = unitTypes[unitIndex % unitTypes.length];
      await prisma.unit.create({
        data: {
          propertyId: property.id,
          buildingId: building.id,
          floorId: floor.id,
          unitNumber: `${floor.sortOrder}${suffix}`,
          unitType,
          squareMeters: 30 + (unitIndex * 10),
          bedrooms: unitType === UnitType.studio ? 0 : unitType === UnitType.one_br ? 1 : unitType === UnitType.two_br ? 2 : 3,
          bathrooms: unitType === UnitType.studio ? 1 : 2,
          hasBalcony: unitIndex % 2 === 0,
          hasParking: unitIndex % 3 === 0,
          facingDirection: ['North', 'South', 'East', 'West'][unitIndex % 4],
        },
      });
      unitIndex++;
    }
  }

  console.log(`Property, building, ${floors.length} floors, and ${unitIndex} units created.`);
  console.log('Seed completed successfully.');
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
