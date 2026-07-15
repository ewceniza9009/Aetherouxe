import { PrismaClient, UserType, PropertyType, PropertyStatus, BuildingType, UnitType, LeaseType, RTOStatus, ServiceCategory, Priority, ServiceStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const FILIPINO_FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Antonio', 'Luisa', 'Carlos', 'Isabel',
  'Miguel', 'Carmen', 'Ramon', 'Teresa', 'Manuel', 'Sofia', 'Pedro', 'Elena',
  'Ricardo', 'Gloria', 'Eduardo', 'Luzviminda', 'Felipe', 'Corazon', 'Emilio', 'Lourdes',
  'Danny', 'Angela', 'Bienvenido', 'Marlene', 'Noli', 'Perlita', 'Ronaldo', 'Imelda',
];

const FILIPINO_LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Mendoza', 'Garcia', 'Tolentino',
  'Aquino', 'Villanueva', 'Navarro', 'Dela Cruz', 'Magsaysay', 'Lopez', 'Fernandez',
  'Ramirez', 'Torres', 'Rivera', 'Santiago', 'Dizon', 'Sarmiento', 'Villamor',
  'Alcantara', 'Castillo', 'David', 'Guzman', 'Jimenez', 'Mercado', 'Palma', 'Quiros',
];

const PROPERTY_NAMES = [
  'Ayala Alabang Village', 'Forbes Park Makati', 'Rockwell Center', 'Serendra BGC',
  'Bonifacio High Street', 'Greenhills San Juan', 'Nuvali Sta. Rosa', 'Anvaya Cove Bataan',
  'Alabang West', 'Capital Commons Pasig', 'Arcovia City Pasig', 'Parklinks Quezon City',
  'Vertis North', 'Cloverleaf Quezon City', 'Arca South Taguig', 'Circuit Makati',
  'Hacienda Heights Balanga', 'Citta Italia Bacolod', 'Davao Park District', 'Pueblo de Panay',
];

const BUILDING_NAMES = [
  'Park Place Tower', 'Skyline Residences', 'The Rise Makati', 'One Rockwell',
  'The Proscenium', 'Two Serendra', 'The Meridian', 'Sunrise Place',
  'Avant-Garde', 'The Imperial', 'Discovery Suites', 'Grand Riviera',
  'The Gallery', 'One Central', 'Plaza Veranda', 'Cristal Tower',
  'Banyan Tree', 'The Columns', 'Azure Urban', 'Satori Residences',
];

const DEVELOPERS = [
  'Ayala Land Premier', 'Alveo Land', 'Avida Land', 'DMCI Homes',
  'Megaworld Corporation', 'SM Development Corporation', 'Robinsons Land',
  'Vista Land & Lifescapes', 'Filinvest Land', '8990 Holdings',
  'Shang Properties', 'Century Properties', 'Rockwell Land', 'RLC Residences',
];

const STREET_NAMES = [
  'Ayala Avenue', 'EDSA', 'C5 Road', 'Commonwealth Avenue', 'Taft Avenue',
  'Roxas Boulevard', 'Makati Avenue', 'Paseo de Roxas', 'Sen. Gil Puyat Avenue',
  'Quezon Avenue', 'Shaw Boulevard', 'Ortigas Avenue', 'Meralco Avenue',
  'Bonifacio Global City', 'Alabang-Zapote Road', 'Daang Hari', 'SLEX',
  'McKinley Parkway', '5th Avenue BGC', '32nd Street BGC',
];

const CITIES = [
  'Makati City', 'Taguig City', 'Quezon City', 'Mandaluyong City',
  'Pasig City', 'Muntinlupa City', 'Parañaque City', 'Las Piñas City',
  'Manila', 'San Juan City', 'BGC Taguig', 'Alabang Muntinlupa',
  'Sta. Rosa Laguna', 'Bacolod City', 'Davao City', 'Cebu City',
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

async function main() {
  console.log('Seeding database with Filipino-themed data...\n');

  // ── Tenant ──
  const developer = pick(DEVELOPERS);
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'elite-realty-demo' },
    update: {},
    create: {
      name: developer,
      domain: 'elite-realty-demo',
      settings: {
        logo: null,
        timezone: 'Asia/Manila',
        currency: 'PHP',
        dateFormat: 'YYYY-MM-DD',
      },
    },
  });
  console.log(`Tenant: ${tenant.name}`);

  // ── Admin & Users ──
  const hash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@elite-realty.com' },
    update: { tenantId: tenant.id, firstName: 'Ma. Cristina', lastName: 'Alcantara', phone: '+639178882222' },
    create: {
      tenantId: tenant.id,
      email: 'admin@elite-realty.com',
      passwordHash: hash,
      userType: UserType.super_admin,
      firstName: 'Ma. Cristina',
      lastName: 'Alcantara',
      phone: '+639178882222',
    },
  });
  console.log(`  Admin: ${admin.firstName} ${admin.lastName}`);

  const agents = await Promise.all(
    Array.from({ length: 4 }, async (_, i) => {
      const first = pick(FILIPINO_FIRST_NAMES);
      const last = pick(FILIPINO_LAST_NAMES);
      return prisma.user.upsert({
        where: { email: `agent${i + 1}@demo.local` },
        update: { firstName: first, lastName: last, phone: `+639${faker.string.numeric(8)}`, tenantId: tenant.id, userType: UserType.agent },
        create: {
          tenantId: tenant.id,
          email: `agent${i + 1}@demo.local`,
          passwordHash: hash,
          userType: UserType.agent,
          firstName: first,
          lastName: last,
          phone: `+639${faker.string.numeric(8)}`,
        },
      });
    }),
  );
  console.log(`  Agents: ${agents.map(a => a.firstName).join(', ')}`);

  const residentHash = await bcrypt.hash('Tenant123!', 12);
  const residents = await Promise.all(
    Array.from({ length: 8 }, async (_, i) => {
      const first = pick(FILIPINO_FIRST_NAMES);
      const last = pick(FILIPINO_LAST_NAMES);
      return prisma.user.upsert({
        where: { email: `resident${i + 1}@demo.local` },
        update: { firstName: first, lastName: last, phone: `+639${faker.string.numeric(8)}`, tenantId: tenant.id, userType: UserType.tenant },
        create: {
          tenantId: tenant.id,
          email: `resident${i + 1}@demo.local`,
          passwordHash: residentHash,
          userType: UserType.tenant,
          firstName: first,
          lastName: last,
          phone: `+639${faker.string.numeric(8)}`,
        },
      });
    }),
  );
  console.log(`  Residents: ${residents.length} created\n`);

  // ── Properties (8) ──
  const selectedProperties = pickN(PROPERTY_NAMES, 8);
  const propertyTypeOptions = [
    PropertyType.condo_unit,
    PropertyType.house_and_lot,
    PropertyType.townhouse,
    PropertyType.commercial_space,
    PropertyType.parking_slot,
  ];

  const properties: Awaited<ReturnType<typeof prisma.property.create>>[] = [];

  for (let i = 0; i < selectedProperties.length; i++) {
    const name = selectedProperties[i]!;
    const code = name
      .split(' ')
      .map(w => w.slice(0, 3).toUpperCase())
      .join('-');

    const property = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        propertyCode: `${code}-${String(i + 1).padStart(3, '0')}`,
        propertyType: pick(propertyTypeOptions),
        status: pick([PropertyStatus.available, PropertyStatus.rented, PropertyStatus.sold, PropertyStatus.rto_active]),
      },
    });

    const city = pick(CITIES);
    const street = pick(STREET_NAMES);
    const bldgName = pick(BUILDING_NAMES);

    const building = await prisma.building.create({
      data: {
        tenantId: tenant.id,
        name: bldgName,
        buildingType: pick([BuildingType.tower, BuildingType.mid_rise, BuildingType.low_rise]),
        floorCount: faker.number.int({ min: 5, max: 15 }),
        unitCount: faker.number.int({ min: 16, max: 40 }),
        address: `${faker.number.int({ min: 101, max: 9999 })} ${street}, ${city}`,
      },
    });

    const floorCount = faker.number.int({ min: 4, max: 8 });
    const floors: { id: string; sortOrder: number }[] = [];
    for (let f = 1; f <= floorCount; f++) {
      const floor = await prisma.floor.create({
        data: {
          buildingId: building.id,
          floorNumber: `${ordinal(f)} Floor`,
          sortOrder: f,
        },
      });
      floors.push(floor);
    }

    const unitTypes = [UnitType.studio, UnitType.one_br, UnitType.two_br, UnitType.three_br];
    const suffixes = ['A', 'B'];

    for (let u = 0; u < 8; u++) {
      const floor = floors[u % floors.length]!;
      const unitType = unitTypes[u % unitTypes.length]!;

      await prisma.unit.create({
        data: {
          propertyId: property.id,
          buildingId: building.id,
          floorId: floor.id,
          unitNumber: `${floor.sortOrder}${suffixes[u % suffixes.length]}`,
          unitType,
          squareMeters: 30 + u * 8,
          bedrooms: unitType === UnitType.studio ? 0 : unitType === UnitType.one_br ? 1 : unitType === UnitType.two_br ? 2 : 3,
          bathrooms: unitType === UnitType.studio ? 1 : 2,
          hasBalcony: u % 2 === 0,
          hasParking: u % 3 === 0,
          facingDirection: pick(['North', 'South', 'East', 'West', 'Northeast', 'Northwest']),
        },
      });
    }

    properties.push(property);
    console.log(`  ${property.propertyCode} — ${name} (${city}) — ${bldgName}, ${floorCount} fl, 8 units`);
  }

  // ── Units lookup for service requests ──
  const allUnits = await prisma.unit.findMany({ take: 64 });

  // ── Leases (6 per property) ──
  const leaseIds: string[] = [];
  let leaseCount = 0;

  for (const property of properties) {
    for (let l = 0; l < 6; l++) {
      const resident = pick(residents);
      const startDate = faker.date.past({ years: 1 });
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      const lease = await prisma.leaseAgreement.create({
        data: {
          propertyId: property.id,
          tenantUserId: resident.id,
          leaseType: pick([LeaseType.standard_rental, LeaseType.standard_rental, LeaseType.standard_rental, LeaseType.corporate_lease]),
          monthlyRentAmount: parseFloat(faker.finance.amount({ min: 15000, max: 80000, dec: 0 })),
          securityDepositAmount: parseFloat(faker.finance.amount({ min: 30000, max: 160000, dec: 0 })),
          startDate,
          endDate,
          isActive: true,
        },
      });
      leaseIds.push(lease.id);
      leaseCount++;
    }
  }
  console.log(`\n  Leases: ${leaseCount}`);

  // ── Mortgage Scenarios (1 per lease, for first 12 leases) ──
  const allLeases = await prisma.leaseAgreement.findMany({
    take: 12,
    include: { property: true, tenant: true },
  });
  let mortgageCount = 0;
  for (const lease of allLeases) {
    const propertyValue = parseFloat(faker.finance.amount({ min: 3000000, max: 15000000, dec: 0 }));
    const downPaymentPct = pick([10, 15, 20, 20, 30]);
    const loanAmount = propertyValue * (1 - downPaymentPct / 100);
    const ratePct = pick([5.5, 6.0, 6.5, 7.0, 7.5]);
    const term = pick([180, 240, 360]);
    const monthlyRate = ratePct / 100 / 12;
    const monthlyAmort = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    const totalInterest = monthlyAmort * term - loanAmount;

    await prisma.mortgageScenario.create({
      data: {
        leaseAgreementId: lease.id,
        propertyId: lease.propertyId,
        generatedForUserId: lease.tenantUserId,
        propertyValueAtGeneration: propertyValue,
        downPaymentPercent: downPaymentPct,
        loanAmount: Math.round(loanAmount),
        interestRatePercent: ratePct,
        loanTermMonths: term,
        monthlyAmortization: Math.round(monthlyAmort * 100) / 100,
        totalInterestPayable: Math.round(totalInterest * 100) / 100,
        status: "draft",
      },
    });
    mortgageCount++;
  }
  console.log(`  Mortgage Scenarios: ${mortgageCount}`);

  // ── Rental Payments (3-6 per lease) ──
  const allLeaseIds = (await prisma.leaseAgreement.findMany({ select: { id: true, monthlyRentAmount: true, startDate: true } })).slice(0, 20);
  let paymentCount = 0;
  for (const lease of allLeaseIds) {
    const monthsOfPayments = faker.number.int({ min: 3, max: 6 });
    const rent = Number(lease.monthlyRentAmount);
    const base = new Date(lease.startDate);

    for (let m = 0; m < monthsOfPayments; m++) {
      const year = base.getFullYear();
      const month = base.getMonth() + m;
      const periodStart = new Date(year, month, 1);
      const periodEnd = new Date(year, month + 1, 1);
      const dueDate = new Date(year, month, 10);

      const isPaid = m < monthsOfPayments - 1 || Math.random() > 0.3;
      const status = isPaid ? "paid" : "pending";

      await prisma.rentalPayment.create({
        data: {
          leaseAgreementId: lease.id,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          dueDate,
          amountDue: rent,
          amountPaid: isPaid ? rent : null,
          paymentDate: isPaid ? faker.date.between({ from: periodStart, to: dueDate }) : null,
          paymentMethod: isPaid ? pick(["card", "ach", "bank_transfer", "cash", "check"]) : null,
          paymentReference: isPaid ? `PAY-${faker.string.alphanumeric(8).toUpperCase()}` : null,
          status,
          lateFeeApplied: !isPaid && Math.random() > 0.5,
        },
      });
      paymentCount++;
    }
  }
  console.log(`  Rental Payments: ${paymentCount}`);

  // ── RTO Contracts (5, linked to first 5 leases) ──
  for (let r = 0; r < 5 && r < leaseIds.length; r++) {
    const monthly = parseFloat(faker.finance.amount({ min: 25000, max: 50000, dec: 0 }));
    const equityPortion = monthly * 0.3;

    await prisma.rtoContract.create({
      data: {
        leaseAgreementId: leaseIds[r]!,
        totalContractValue: parseFloat(faker.finance.amount({ min: 3000000, max: 8000000, dec: 0 })),
        optionFeeAmount: parseFloat(faker.finance.amount({ min: 50000, max: 200000, dec: 0 })),
        monthlyRentPortion: monthly - equityPortion,
        monthlyEquityPortion: equityPortion,
        accumulatedEquity: equityPortion * faker.number.int({ min: 3, max: 10 }),
        targetPurchaseDate: faker.date.future({ years: 5 }),
        purchaseOptionPrice: parseFloat(faker.finance.amount({ min: 500000, max: 2000000, dec: 0 })),
        status: pick([RTOStatus.active, RTOStatus.active, RTOStatus.grace_period]),
      },
    });
  }
  console.log(`  RTO Contracts: 5`);

  // ── Service Requests (14) ──
  const categories = [ServiceCategory.plumbing, ServiceCategory.electrical, ServiceCategory.hvac, ServiceCategory.general, ServiceCategory.pest];

  for (let s = 0; s < 14; s++) {
    const property = pick(properties);
    const unit = pick(allUnits);
    const agent = pick(agents);

    await prisma.serviceRequest.create({
      data: {
        propertyId: property.id,
        unitId: unit.id,
        assignedToId: agent.id,
        tenantId: tenant.id,
        category: pick(categories),
        priority: pick([Priority.low, Priority.medium, Priority.high]),
        description: faker.lorem.sentence({ min: 8, max: 20 }),
        status: pick([ServiceStatus.open, ServiceStatus.in_progress, ServiceStatus.completed]),
        requestedAt: faker.date.past({ years: 1 }),
      },
    });
  }
  console.log(`  Service Requests: 14\n`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
