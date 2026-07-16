import {
  PrismaClient,
  UserType,
  PropertyType,
  PropertyStatus,
  BuildingType,
  UnitType,
  ProjectType,
  ProjectStatus,
  PhaseStatus,
  BudgetCategory,
  ContractorEngagementStatus,
  LeaseType,
  RTOStatus,
  AgentTier,
  CommissionType,
  TransactionType,
  CommissionStatus,
  InvoiceType,
  InvoiceStatus,
  UtilityType,
  BillStatus,
  AmenityType,
  BookingStatus,
  ServiceCategory,
  Priority,
  ServiceStatus,
  PostType,
  Audience,
  DocumentType,
  DocOwnerType,
  SignatureStatus,
  PnlStatus,
  ReminderType,
  ReminderChannel,
  ReminderStatus,
  CollectionActivityType,
  CollectionCaseStatus,
  CollectionCasePriority,
  NotificationType,
  NotificationRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

faker.seed(20260615);

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const pick = <T>(arr: T[]): T => faker.helpers.arrayElement(arr);
const pickN = <T>(arr: T[], n: number): T[] => faker.helpers.arrayElements(arr, n);
const chance = (p: number) => faker.number.float({ min: 0, max: 1 }) < p;
const money = (min: number, max: number) => Math.round(faker.number.float({ min, max }) / 100) * 100;
const pct = (base: number, percent: number) => Math.round((base * percent) / 100);
const phPhone = () => `+63 ${faker.string.numeric(3)} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

const FILIPINO_FIRST = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Antonio', 'Luisa', 'Carlos', 'Isabel', 'Miguel', 'Carmen',
  'Ramon', 'Teresa', 'Manuel', 'Sofia', 'Pedro', 'Elena', 'Ricardo', 'Gloria', 'Eduardo', 'Luzviminda',
  'Felipe', 'Corazon', 'Emilio', 'Lourdes', 'Danny', 'Angela', 'Bienvenido', 'Marlene', 'Noli', 'Perlita',
  'Ronaldo', 'Imelda', 'Andres', 'Josephine', 'Paolo', 'Katrina', 'Gabriel', 'Beatriz',
];
const FILIPINO_LAST = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Gonzales', 'Mendoza', 'Garcia', 'Tolentino', 'Aquino', 'Villanueva',
  'Navarro', 'Dela Cruz', 'Magsaysay', 'Lopez', 'Fernandez', 'Ramirez', 'Torres', 'Rivera', 'Santiago', 'Dizon',
  'Sarmiento', 'Villamor', 'Alcantara', 'Castillo', 'David', 'Guzman', 'Jimenez', 'Mercado', 'Palma', 'Quiros',
];

const name = () => `${pick(FILIPINO_FIRST)} ${pick(FILIPINO_LAST)}`;
const person = () => {
  const first = pick(FILIPINO_FIRST);
  const last = pick(FILIPINO_LAST);
  return { first, last, email: `${first}.${last}.${faker.string.alphanumeric(4)}`.toLowerCase() + '@elite-realty.com' };
};

const DEVELOPERS = [
  'Ayala Land Premier', 'Alveo Land', 'Avida Land', 'DMCI Homes', 'Megaworld Corporation',
  'SM Development Corporation', 'Robinsons Land', 'Vista Land & Lifescapes', 'Filinvest Land',
  'Shang Properties', 'Century Properties', 'Rockwell Land',
];

const PROJECTS = [
  { name: 'Horizon Ayala Towers', code: 'HAT', type: ProjectType.high_rise, city: 'Makati City' },
  { name: 'Avida Village Nuvali', code: 'AVV', type: ProjectType.village, city: 'Sta. Rosa Laguna' },
  { name: 'The Arca South Residences', code: 'ARC', type: ProjectType.commercial_complex, city: 'Taguig City' },
  { name: 'Vertis North Residences', code: 'VNN', type: ProjectType.mid_rise, city: 'Quezon City' },
];

const BUILDINGS = [
  { name: 'Tower 1', code: 'T1', type: BuildingType.tower },
  { name: 'Tower 2', code: 'T2', type: BuildingType.tower },
  { name: 'Parkview Cluster', code: 'PVC', type: BuildingType.cluster },
  { name: 'Garden Block', code: 'GB', type: BuildingType.block },
  { name: 'The Rise', code: 'TR', type: BuildingType.mid_rise },
];

const STREETS = ['Ayala Avenue', 'EDSA', 'C5 Road', 'Commonwealth Avenue', 'Taft Avenue', 'Roxas Boulevard', 'McKinley Parkway', '32nd Street BGC', 'Alabang-Zapote Road'];
const CITIES = ['Makati City', 'Taguig City', 'Quezon City', 'Mandaluyong City', 'Pasig City', 'Muntinlupa City', 'Parañaque City', 'Las Piñas City', 'Sta. Rosa Laguna', 'Cebu City', 'Davao City'];

/* ------------------------------------------------------------------ *
 * Mortgage amortization builder (mirrors fixed MortgageService)
 * ------------------------------------------------------------------ */

function buildAmortization(loanAmount: number, annualRatePct: number, n: number) {
  const i = annualRatePct / 100 / 12;
  const roundedPayment =
    i === 0 ? round2(loanAmount / n) : round2((loanAmount * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
  const rows: any[] = [];
  let beginning = loanAmount;
  let cumInterest = 0;
  for (let p = 1; p <= n; p++) {
    const interest = round2(beginning * i);
    let principal: number;
    let payment: number;
    let ending: number;
    if (p === n) {
      principal = round2(beginning);
      payment = round2(interest + principal);
      ending = 0;
    } else {
      payment = roundedPayment;
      principal = round2(payment - interest);
      ending = round2(beginning - principal);
    }
    cumInterest = round2(cumInterest + interest);
    rows.push({
      periodNumber: p,
      beginningBalance: round2(beginning),
      monthlyPayment: payment,
      principalPayment: principal,
      interestPayment: interest,
      endingBalance: ending,
      cumulativeInterestPaid: cumInterest,
    });
    beginning = ending;
  }
  return { rows, monthly: roundedPayment, totalInterest: round2(roundedPayment * n - loanAmount) };
}

/* ------------------------------------------------------------------ *
 * Cleanup (idempotent reseed)
 * ------------------------------------------------------------------ */

async function cleanup() {
  const order = [
    'notification', 'collectionActivity', 'collectionCase', 'collectionCaseNote',
    'statementOfAccount', 'paymentReminder',
    'arPayment', 'arPaymentArrangement', 'arInvoice', 'arCollectionAction', 'arArrangementInstallment',
    'rtoEquityLedger', 'rtoPaymentAllocation', 'rtoContract',
    'mortgageAmortizationSchedule', 'mortgageScenario',
    'rentalPayment', 'leaseAgreement',
    'consumptionReading', 'utilityBill', 'utilityMeter', 'utilityRate',
    'agentCommissionRelease', 'agentTransaction', 'agentLicenseRenewal', 'agentCommission',
    'realEstateAgent',
    'budgetLineItem', 'contractorPayment', 'contractorEngagement', 'budget', 'phase', 'contractor',
    'documentSignature', 'documentVault',
    'communityPost', 'amenityBooking', 'amenity', 'maintenanceWorkOrder', 'serviceRequest',
    'ownerPnlStatement',
    'unit', 'floor', 'building', 'property', 'project',
    'user',
  ] as const;
  for (const m of order) {
    // @ts-expect-error dynamic model access
    await prisma[m].deleteMany();
  }
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log('Database already seeded (users exist) — skipping seed.\n');
    return;
  }

  console.log('Seeding Elite Realty with realistic, portal-rich Filipino data...\n');
  await cleanup();

  /* ── Tenant / Company ── */
  const developer = pick(DEVELOPERS);
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'elite-realty-demo' },
    update: {},
    create: {
      name: developer,
      domain: 'elite-realty-demo',
      logoUrl: 'https://cdn.elite-realty.example/logo.svg',
      settings: {
        company: {
          legalName: `${developer}, Inc.`,
          tradeName: 'Elite Realty',
          tin: `000-${faker.string.numeric(3)}-${faker.string.numeric(3)}-000`,
          secRegistration: `CS${faker.string.numeric(6)}`,
          address: `${faker.number.int({ min: 10, max: 999 })} ${pick(STREETS)}, ${pick(CITIES)}`,
          contactEmail: 'admin@elite-realty.com',
          contactPhone: phPhone(),
          website: 'https://elite-realty.example',
        },
        locale: 'en-PH',
        currency: 'PHP',
        currencySymbol: '₱',
        timezone: 'Asia/Manila',
        dateFormat: 'MMM DD, YYYY',
        fiscalYearStartMonth: 1,
        branding: {
          primaryColor: '#0A1428',
          accentColor: '#D4AF37',
          theme: 'midnight-sovereign',
        },
        features: {
          mortgage: true,
          rentToOwn: true,
          utilityBilling: true,
          ownerPortal: true,
          residentPortal: true,
          community: true,
        },
      },
    },
  });
  console.log(`Tenant/Company: ${tenant.name}`);

  /* ── Users ── */
  const hash = await bcrypt.hash('Admin123!', 12);
  const residentHash = await bcrypt.hash('Tenant123!', 12);
  const ownerHash = await bcrypt.hash('Owner123!', 12);
  const agentHash = await bcrypt.hash('Agent123!', 12);

  const adminP = person();
  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@elite-realty.com',
      passwordHash: hash,
      userType: UserType.super_admin,
      firstName: 'Ma. Cristina',
      lastName: 'Alcantara',
      phone: phPhone(),
    },
  });

  const pmP = person();
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'pm@elite-realty.com',
      passwordHash: hash,
      userType: UserType.property_manager,
      firstName: pmP.first,
      lastName: pmP.last,
      phone: phPhone(),
    },
  });

  const finP = person();
  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'finance@elite-realty.com',
      passwordHash: hash,
      userType: UserType.finance,
      firstName: finP.first,
      lastName: finP.last,
      phone: phPhone(),
    },
  });

  // Agents + real estate agent profiles
  const agents: { user: any; agent: any }[] = [];
  const agentTiers = [AgentTier.team_lead, AgentTier.senior, AgentTier.senior, AgentTier.junior, AgentTier.external_broker];
  for (let i = 0; i < 5; i++) {
    const p = person();
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `agent${i + 1}@elite-realty.com`,
        passwordHash: agentHash,
        userType: UserType.agent,
        firstName: p.first,
        lastName: p.last,
        phone: phPhone(),
      },
    });
    const agent = await prisma.realEstateAgent.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        licenseNumber: `PRC-${faker.string.numeric(7)}`,
        tinNumber: `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(3)}`,
        commissionRateDefault: Number(faker.helpers.arrayElement([3, 3.5, 4, 5]).toFixed(2)),
        tier: agentTiers[i]!,
        isInternal: i !== 4,
        managerId: i === 0 ? null : agents[0]?.agent.id ?? null,
      },
    });
    // license renewals
    const exp = faker.date.soon({ days: 400 });
    const status = exp < new Date() ? 'expired' : exp < faker.date.soon({ days: 60 }) ? 'expiring_soon' : 'compliant';
    await prisma.agentLicenseRenewal.create({
      data: {
        tenantId: tenant.id,
        agentId: agent.id,
        licenseNumber: agent.licenseNumber,
        licenseExpiryDate: exp,
        cpeUnitsCompleted: faker.number.int({ min: 0, max: 45 }),
        cpeUnitsRequired: 45,
        renewalStatus: status,
        lastRenewedAt: faker.date.past({ years: 1 }),
      },
    });
    agents.push({ user, agent });
  }

  // Owners (investors)
  const owners: any[] = [];
  for (let i = 0; i < 6; i++) {
    const p = person();
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `owner${i + 1}@elite-realty.com`,
        passwordHash: ownerHash,
        userType: UserType.owner,
        firstName: p.first,
        lastName: p.last,
        phone: phPhone(),
      },
    });
    owners.push(user);
  }

  // Residents (tenants)
  const residents: any[] = [];
  for (let i = 0; i < 14; i++) {
    const p = person();
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: `resident${i + 1}@elite-realty.com`,
        passwordHash: residentHash,
        userType: UserType.tenant,
        firstName: p.first,
        lastName: p.last,
        phone: phPhone(),
      },
    });
    residents.push(user);
  }
  console.log(`Users: 1 super_admin, 1 PM, 1 finance, ${agents.length} agents, ${owners.length} owners, ${residents.length} residents`);

  /* ── Utility Rates (water + electricity) ── */
  await prisma.utilityRate.createMany({
    data: [
      { tenantId: tenant.id, meterType: UtilityType.water, ratePerUnit: 28.5, baseCharge: 50, effectiveFrom: faker.date.past({ years: 2 }) },
      { tenantId: tenant.id, meterType: UtilityType.electricity, ratePerUnit: 11.0, baseCharge: 70, effectiveFrom: faker.date.past({ years: 2 }) },
      { tenantId: tenant.id, meterType: UtilityType.water, ratePerUnit: 31.0, baseCharge: 55, effectiveFrom: faker.date.future({ years: 1 }) },
    ],
  });

  /* ── Projects, Phases, Budgets, Contractors ── */
  const contractors: any[] = [];
  const CONTRACTOR_NAMES = ['Megabuild Construction', 'Prime Structures Inc.', 'Cebu Engineering Works', 'Luzon MEP Services', 'Golden Ratio Interiors', 'Verde Landscaping'];
  for (const cname of CONTRACTOR_NAMES) {
    contractors.push(
      await prisma.contractor.create({
        data: {
          tenantId: tenant.id,
          companyName: cname,
          contactPerson: name(),
          email: `${cname.split(' ')[0].toLowerCase()}@contractor.example`,
          phone: phPhone(),
          licenseNumber: `PCAB-${faker.string.numeric(6)}`,
          taxId: `${faker.string.numeric(3)}-${faker.string.numeric(3)}-${faker.string.numeric(3)}`,
          specialization: pick(['General Contracting', 'MEPF', 'Fit-out', 'Landscaping', 'Structural']),
          isActive: true,
        },
      }),
    );
  }

  const projects: any[] = [];
  for (const proj of PROJECTS) {
    const status = pick([ProjectStatus.pre_selling, ProjectStatus.construction, ProjectStatus.fit_out, ProjectStatus.planning]);
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: proj.name,
        description: `${proj.name} — a premium ${proj.type.replace('_', ' ')} development in ${proj.city}.`,
        projectType: proj.type,
        status,
        totalPhases: faker.number.int({ min: 2, max: 4 }),
        targetStartDate: faker.date.past({ years: 1 }),
        targetCompletionDate: faker.date.future({ years: 3 }),
        address: `${faker.number.int({ min: 10, max: 999 })} ${pick(STREETS)}, ${proj.city}`,
        projectLogoUrl: 'https://cdn.elite-realty.example/project.svg',
      },
    });

    const phaseCount = faker.number.int({ min: 2, max: 3 });
    for (let ph = 1; ph <= phaseCount; ph++) {
      await prisma.phase.create({
        data: {
          projectId: project.id,
          phaseName: `Phase ${ph}`,
          phaseOrder: ph,
          status: pick([PhaseStatus.planning, PhaseStatus.in_progress, PhaseStatus.completed]),
          targetStart: faker.date.past({ years: 1 }),
          targetEnd: faker.date.future({ years: 2 }),
          actualStart: chance(0.6) ? faker.date.past({ years: 1 }) : null,
          actualEnd: chance(0.2) ? faker.date.recent({ days: 60 }) : null,
        },
      });
    }

    // Budget with line items + contractor engagements + payments
    const budget = await prisma.budget.create({
      data: {
        projectId: project.id,
        budgetName: `${proj.name} Master Budget`,
        totalBudgetAmount: money(200_000_000, 1_500_000_000),
        approvedByUserId: admin.id,
        isCurrentVersion: true,
        versionNumber: 1,
      },
    });

    const categories: BudgetCategory[] = [
      BudgetCategory.land_acquisition, BudgetCategory.construction, BudgetCategory.permits,
      BudgetCategory.architectural_design, BudgetCategory.engineering, BudgetCategory.interior_fit_out,
      BudgetCategory.landscaping, BudgetCategory.marketing, BudgetCategory.contingency, BudgetCategory.misc,
    ];
    const chosen = pickN(categories, faker.number.int({ min: 6, max: 9 }));
    for (const cat of chosen) {
      const planned = money(5_000_000, 300_000_000);
      const line = await prisma.budgetLineItem.create({
        data: {
          budgetId: budget.id,
          category: cat,
          subcategory: pick(['Phase 1', 'Tower A', 'Common Areas', 'MEPF', 'Fit-out']),
          plannedAmount: planned,
          startDate: faker.date.past({ years: 1 }),
          endDate: faker.date.future({ years: 2 }),
          vendorName: pick(contractors).companyName,
          notes: faker.lorem.sentence(),
        },
      });
      // contractor engagement + payments (drives dynamic actual)
      const contractor = pick(contractors);
      const eng = await prisma.contractorEngagement.create({
        data: {
          budgetLineItemId: line.id,
          contractorId: contractor.id,
          contractAmount: round2(planned * faker.number.float({ min: 0.6, max: 0.95 })),
          startDate: faker.date.past({ years: 1 }),
          endDate: faker.date.future({ years: 1 }),
          contractDocumentUrl: 'https://cdn.elite-realty.example/contract.pdf',
          terms: 'Net 30',
          status: pick([ContractorEngagementStatus.active, ContractorEngagementStatus.completed, ContractorEngagementStatus.pending]),
        },
      });
      const payCount = faker.number.int({ min: 1, max: 4 });
      for (let k = 0; k < payCount; k++) {
        await prisma.contractorPayment.create({
          data: {
            contractorEngagementId: eng.id,
            amount: round2((eng.contractAmount as unknown as number) / payCount),
            paymentDate: faker.date.past({ years: 1 }),
            invoiceReference: `INV-${faker.string.alphanumeric(6).toUpperCase()}`,
            paymentMethod: pick(['bank_transfer', 'check', 'gcash']),
            status: pick(['approved', 'paid', 'pending_approval']),
            approvedByUserId: chance(0.7) ? admin.id : null,
            receiptUrl: 'https://cdn.elite-realty.example/receipt.pdf',
          },
        });
      }
    }
    projects.push(project);
  }
  console.log(`Projects: ${projects.length} with budgets, phases, contractors`);

  /* ── Properties, Buildings, Floors, Units ── */
  const propertyTypeOptions = [PropertyType.condo_unit, PropertyType.house_and_lot, PropertyType.townhouse, PropertyType.commercial_space, PropertyType.parking_slot];
  const unitTypes = [UnitType.studio, UnitType.one_br, UnitType.two_br, UnitType.three_br, UnitType.penthouse];

  // Map each project to a building code set
  const allUnits: any[] = [];
  const leaseTargets: { property: any; unit: any }[] = [];

  for (const project of projects) {
    const projCode = PROJECTS.find((p) => p.name === project.name)!.code;
    const bldg = pick(BUILDINGS);
    const building = await prisma.building.create({
      data: {
        tenantId: tenant.id,
        projectId: project.id,
        name: `${project.name} — ${bldg.name}`,
        buildingType: bldg.type,
        floorCount: faker.number.int({ min: 6, max: 40 }),
        unitCount: faker.number.int({ min: 20, max: 120 }),
        address: project.address!,
      },
    });

    const numProps = faker.number.int({ min: 2, max: 3 });
    for (let pr = 0; pr < numProps; pr++) {
      const ptype = pick(propertyTypeOptions);
      const unitNo = String(faker.number.int({ min: 1, max: 999 })).padStart(3, '0');
      const propertyCode = `${projCode}-${bldg.code}-${unitNo}`;
      const property = await prisma.property.create({
        data: {
          tenantId: tenant.id,
          propertyCode,
          propertyType: ptype,
          status: pick([PropertyStatus.available, PropertyStatus.rented, PropertyStatus.sold, PropertyStatus.rto_active, PropertyStatus.reserved]),
          specsDocumentId: null,
        },
      });

      const floorCount = faker.number.int({ min: 5, max: 12 });
      const floors: any[] = [];
      for (let f = 1; f <= floorCount; f++) {
        floors.push(
          await prisma.floor.create({
            data: {
              buildingId: building.id,
              floorNumber: f === 1 ? 'G' : String(f),
              sortOrder: f,
              floorPlanUrl: 'https://cdn.elite-realty.example/floorplan.svg',
            },
          }),
        );
      }

      const unitCount = faker.number.int({ min: 6, max: 12 });
      for (let u = 0; u < unitCount; u++) {
        const floor = floors[u % floors.length]!;
        const ut = pick(unitTypes);
        const unit = await prisma.unit.create({
          data: {
            propertyId: property.id,
            buildingId: building.id,
            floorId: floor.id,
            unitNumber: `${floor.sortOrder}${pick(['A', 'B', 'C'])}`,
            unitType: ut,
            squareMeters: faker.number.int({ min: 24, max: 220 }),
            bedrooms: ut === UnitType.studio ? 0 : ut === UnitType.one_br ? 1 : ut === UnitType.two_br ? 2 : 3,
            bathrooms: ut === UnitType.studio ? 1 : 2,
            hasBalcony: chance(0.5),
            hasParking: chance(0.4),
            facingDirection: pick(['North', 'South', 'East', 'West', 'Corner']),
          },
        });
        allUnits.push(unit);
        if (chance(0.5)) leaseTargets.push({ property, unit });
      }
    }
  }
  console.log(`Properties & units created (${allUnits.length} units)`);

  /* ── Leases, Rental Payments, RTO, Mortgage ── */
  let leaseCount = 0;
  let mortgageCount = 0;
  let rtoCount = 0;
  const rtoLeases: any[] = [];
  const residentLeases: Record<string, any> = {};
  const leasedUnitIds = new Set<string>();

  for (const target of leaseTargets) {
    const resident = pick(residents);
    const leaseType = pick([LeaseType.standard_rental, LeaseType.standard_rental, LeaseType.corporate_lease, LeaseType.rent_to_own]);
    const monthlyRent = money(15000, 120000);
    const startDate = faker.date.past({ years: 1 });
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + (leaseType === LeaseType.corporate_lease ? 3 : 1));

    const lease = await prisma.leaseAgreement.create({
      data: {
        propertyId: target.property.id,
        unitId: target.unit?.id,
        unitLabel: target.unit?.unitNumber,
        tenantUserId: resident.id,
        leaseType,
        startDate,
        endDate,
        monthlyRentAmount: monthlyRent,
        securityDepositAmount: monthlyRent * 2,
        securityDepositHeldIn: `BDO Savings ****${faker.string.numeric(4)}`,
        latePaymentPenaltyPercent: 5,
        gracePeriodDays: 3,
        isActive: true,
      },
    });
    leaseCount++;
    residentLeases[resident.id] = lease;
    if (target.unit?.id) leasedUnitIds.add(target.unit.id);

    // Rental payment history
    const months = faker.number.int({ min: 3, max: 8 });
    const base = new Date(startDate);
    for (let m = 0; m < months; m++) {
      const periodStart = new Date(base.getFullYear(), base.getMonth() + m, 1);
      const periodEnd = new Date(base.getFullYear(), base.getMonth() + m + 1, 1);
      const due = new Date(base.getFullYear(), base.getMonth() + m, 10);
      const isPaid = m < months - 1 || chance(0.6);
      const status = isPaid ? 'paid' : chance(0.5) ? 'overdue' : 'pending';
      await prisma.rentalPayment.create({
        data: {
          leaseAgreementId: lease.id,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          dueDate: due,
          amountDue: monthlyRent,
          amountPaid: isPaid ? monthlyRent : 0,
          paymentDate: isPaid ? faker.date.between({ from: periodStart, to: due }) : null,
          paymentMethod: isPaid ? pick(['card', 'bank_transfer', 'gcash', 'cash', 'check']) : null,
          paymentReference: isPaid ? `PAY-${faker.string.alphanumeric(8).toUpperCase()}` : null,
          status,
          lateFeeApplied: !isPaid && chance(0.4),
        },
      });
    }

    // RTO contract for rent_to_own leases
    if (leaseType === LeaseType.rent_to_own) {
      rtoLeases.push(lease);
      const equityPortion = round2(monthlyRent * 0.3);
      const rentPortion = round2(monthlyRent - equityPortion);
      const rto = await prisma.rtoContract.create({
        data: {
          leaseAgreementId: lease.id,
          totalContractValue: money(3_000_000, 12_000_000),
          optionFeeAmount: money(50_000, 250_000),
          monthlyRentPortion: rentPortion,
          monthlyEquityPortion: equityPortion,
          accumulatedEquity: 0,
          targetPurchaseDate: faker.date.future({ years: 5 }),
          purchaseOptionPrice: money(4_000_000, 15_000_000),
          status: pick([RTOStatus.active, RTOStatus.active, RTOStatus.grace_period]),
        },
      });
      rtoCount++;

      // Seed equity ledger + allocations from existing rental payments
      let running = 0;
      const payments = await prisma.rentalPayment.findMany({ where: { leaseAgreementId: lease.id, status: 'paid' } });
      for (const pay of payments) {
        running = round2(running + equityPortion);
        const ledger = await prisma.rtoEquityLedger.create({
          data: {
            rtoContractId: rto.id,
            transactionType: 'payment_credit',
            amount: equityPortion,
            runningBalance: running,
            reference: pay.paymentReference ?? `PAY-${pay.id}`,
            createdByUserId: resident.id,
          },
        });
        await prisma.rtoPaymentAllocation.create({
          data: {
            rentalPaymentId: pay.id,
            rtoContractId: rto.id,
            rentPortionAmount: rentPortion,
            equityPortionAmount: equityPortion,
            totalPaymentAmount: round2(rentPortion + equityPortion),
          },
        });
        void ledger;
      }
      await prisma.rtoContract.update({ where: { id: rto.id }, data: { accumulatedEquity: running } });
    }

    // Mortgage scenarios for a subset of leases (resident explores options)
    if (chance(0.4)) {
      const propertyValue = money(3_000_000, 25_000_000);
      const downPct = pick([10, 15, 20, 20, 30]);
      const loanAmount = round2(propertyValue * (1 - downPct / 100));
      const rate = pick([5.5, 6.0, 6.5, 7.0, 7.5]);
      const term = pick([180, 240, 360]);
      const { rows, monthly, totalInterest } = buildAmortization(loanAmount, rate, term);
      const scenario = await prisma.mortgageScenario.create({
        data: {
          leaseAgreementId: lease.id,
          propertyId: target.property.id,
          generatedForUserId: resident.id,
          propertyValueAtGeneration: propertyValue,
          downPaymentPercent: downPct,
          loanAmount,
          interestRatePercent: rate,
          loanTermMonths: term,
          monthlyAmortization: monthly,
          totalInterestPayable: totalInterest,
          status: pick(['draft', 'presented', 'tenant_interested']),
          expiryDate: faker.date.future({ years: 1 }),
        },
      });
      await prisma.mortgageAmortizationSchedule.createMany({
        data: rows.map((r) => ({ ...r, mortgageScenarioId: scenario.id })),
      });
      mortgageCount++;
    }
  }
  console.log(`Leases: ${leaseCount} | RTO: ${rtoCount} | Mortgage: ${mortgageCount}`);

  /* ── Utility Meters, Readings, Bills ── */
  let billCount = 0;
  const billedUnits = allUnits.filter((u) => leasedUnitIds.has(u.id));
  for (const unit of pickN(billedUnits, Math.min(40, billedUnits.length))) {
    for (const meterType of [UtilityType.water, UtilityType.electricity]) {
      const meter = await prisma.utilityMeter.create({
        data: {
          tenantId: tenant.id,
          unitId: unit.id,
          propertyId: unit.propertyId,
          utilityType: meterType,
          meterNumber: `${meterType === UtilityType.water ? 'WM' : 'EM'}-${faker.string.alphanumeric(8).toUpperCase()}`,
          multiplier: 1,
          isActive: true,
          installationDate: faker.date.past({ years: 2 }),
        },
      });
      let prev = faker.number.int({ min: 100, max: 500 });
      const months = faker.number.int({ min: 3, max: 6 });
      const now = new Date();
      for (let m = months; m >= 1; m--) {
        const periodEnd = new Date(now.getFullYear(), now.getMonth() - m + 1, 1);
        const periodStart = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const current = prev + faker.number.int({ min: 5, max: 60 });
        const consumption = current - prev;
        const rate = meterType === UtilityType.water ? 28.5 : 11.0;
        const base = meterType === UtilityType.water ? 50 : 70;
        // reading
        await prisma.consumptionReading.create({
          data: { meterId: meter.id, readingDate: periodEnd, value: current, reader: chance(0.5) ? 'meter_reader' : null, note: null },
        });
        const amountDue = round2(consumption * rate + base);
        const paid = chance(0.7);
        await prisma.utilityBill.create({
          data: {
            meterId: meter.id,
            tenantId: tenant.id,
            unitId: unit.id,
            propertyId: unit.propertyId,
            billingPeriodStart: periodStart,
            billingPeriodEnd: periodEnd,
            previousReading: prev,
            currentReading: current,
            consumption,
            ratePerUnit: rate,
            amountDue,
            status: paid ? BillStatus.paid : BillStatus.pending,
            issuedDate: periodStart,
            dueDate: new Date(periodEnd.getFullYear(), periodEnd.getMonth(), 15),
          },
        });
        billCount++;
        prev = current;
      }
    }
  }
  console.log(`Utility bills: ${billCount}`);

  /* ── Accounts Receivable (invoices, payments, arrangements) ── */
  let arCount = 0;
  for (const resident of residents) {
    const invoices = faker.number.int({ min: 1, max: 3 });
    for (let k = 0; k < invoices; k++) {
      const amount = money(2000, 40000);
      const due = faker.date.recent({ days: 45 });
      const paid = chance(0.6);
      const status: InvoiceStatus = paid ? InvoiceStatus.paid : due < new Date() ? InvoiceStatus.overdue : InvoiceStatus.pending;
      const inv = await prisma.arInvoice.create({
        data: {
          tenantId: tenant.id,
          userId: resident.id,
          invoiceType: pick([InvoiceType.rental, InvoiceType.utility_water, InvoiceType.utility_electricity, InvoiceType.association_dues, InvoiceType.late_fee]),
          invoiceNumber: `AR-${faker.string.alphanumeric(8).toUpperCase()}`,
          amount,
          dueDate: due,
          status,
          issuedDate: faker.date.past({ years: 1 }),
        },
      });
      if (paid) {
        await prisma.arPayment.create({
          data: {
            invoiceId: inv.id,
            amount,
            paymentDate: faker.date.between({ from: inv.issuedDate, to: new Date() }),
            paymentMethod: pick(['bank_transfer', 'gcash', 'card', 'cash']),
            receivedByUserId: admin.id,
          },
        });
      }
      arCount++;
    }
    // payment arrangement for some
    if (chance(0.3)) {
      const total = money(10000, 60000);
      const installments = faker.number.int({ min: 3, max: 6 });
      const arr = await prisma.arPaymentArrangement.create({
        data: {
          userId: resident.id,
          totalOutstandingAmount: total,
          numberOfInstallments: installments,
          installmentAmount: round2(total / installments),
          startDate: faker.date.recent({ days: 30 }),
          endDate: faker.date.future({ years: 1 }),
          status: pick(['active', 'approved', 'proposed']),
          approvedByUserId: chance(0.7) ? admin.id : null,
        },
      });
      for (let ins = 1; ins <= installments; ins++) {
        await prisma.arArrangementInstallment.create({
          data: {
            paymentArrangementId: arr.id,
            installmentNumber: ins,
            dueDate: faker.date.future({ years: 1 }),
            amount: round2(total / installments),
            status: ins === 1 && chance(0.5) ? 'paid' : 'pending',
            paidDate: ins === 1 && chance(0.5) ? faker.date.recent({ days: 10 }) : null,
          },
        });
      }
    }
  }
  console.log(`AR invoices: ${arCount}`);

  /* ── Agent Commissions, Transactions, Releases ── */
  const commissionRules = [
    await prisma.agentCommission.create({ data: { tenantId: tenant.id, name: 'Default Residential', agentTier: null, propertyType: null, commissionType: CommissionType.percentage_of_sale, commissionValue: '3', isActive: true } }),
    await prisma.agentCommission.create({ data: { tenantId: tenant.id, name: 'Luxury High-Rise Bonus', agentTier: AgentTier.team_lead, propertyType: PropertyType.condo_unit, commissionType: CommissionType.percentage_of_sale, commissionValue: '5', isActive: true } }),
    await prisma.agentCommission.create({ data: { tenantId: tenant.id, name: 'Rental Lease Commission', propertyType: null, commissionType: CommissionType.percentage_of_rent, commissionValue: '1', isActive: true } }),
    await prisma.agentCommission.create({ data: { tenantId: tenant.id, name: 'Tiered Sales', propertyType: PropertyType.house_and_lot, commissionType: CommissionType.tiered, commissionValue: JSON.stringify([{ upto: 5000000, rate: 3 }, { upto: 10000000, rate: 4 }, { upto: null, rate: 5 }]), isActive: true } }),
  ];

  const properties = await prisma.property.findMany({ take: 12 });
  for (const agent of agents) {
    const txns = faker.number.int({ min: 3, max: 6 });
    for (let t = 0; t < txns; t++) {
      const property = pick(properties);
      const txType = pick([TransactionType.sale, TransactionType.rental_lease, TransactionType.rto_contract, TransactionType.lease_renewal]);
      const txAmount = txType === TransactionType.rental_lease ? money(15000, 120000) : money(3_000_000, 20_000_000);
      const rule = commissionRules[t % commissionRules.length]!;
      const calc = rule.commissionType === CommissionType.tiered
        ? round2(txAmount * 0.04)
        : rule.commissionType === CommissionType.percentage_of_rent
          ? round2((txAmount * Number(rule.commissionValue)) / 100)
          : round2((txAmount * Number(rule.commissionValue)) / 100);
      const tx = await prisma.agentTransaction.create({
        data: {
          agentId: agent.agent.id,
          transactionType: txType,
          propertyId: property.id,
          transactionAmount: txAmount,
          commissionRuleId: rule.id,
          calculatedCommission: calc,
          finalCommission: calc,
          status: pick([CommissionStatus.approved, CommissionStatus.pending, CommissionStatus.partially_paid, CommissionStatus.fully_paid]),
          transactionDate: faker.date.past({ years: 1 }),
        },
      });
      // releases
      if (chance(0.7)) {
        const rel = await prisma.agentCommissionRelease.create({
          data: {
            agentTransactionId: tx.id,
            amount: round2(calc * faker.number.float({ min: 0.3, max: 1 })),
            releaseDate: faker.date.recent({ days: 120 }),
            releaseType: pick(['initial', 'installment', 'final_payment', 'bonus']),
            paymentReference: `COMM-${faker.string.alphanumeric(6).toUpperCase()}`,
          },
        });
        void rel;
      }
    }
  }
  console.log('Agent commissions, transactions & releases created');

  /* ── Owner P&L Statements ── */
  let pnlCount = 0;
  for (const owner of owners) {
    const ownedProps = pickN(properties, faker.number.int({ min: 1, max: 3 }));
    for (const prop of ownedProps) {
      const gross = money(60_000, 600_000);
      const expenses = money(10_000, gross * 0.4);
      const mgmt = round2(gross * 0.08);
      const net = round2(gross - expenses - mgmt);
      await prisma.ownerPnlStatement.create({
        data: {
          ownerId: owner.id,
          propertyId: prop.id,
          periodStart: faker.date.past({ years: 1 }),
          periodEnd: faker.date.recent({ days: 10 }),
          grossRentalIncome: gross,
          totalExpenses: expenses,
          managementFee: mgmt,
          netIncome: net,
          yieldPct: round2((net / (gross + expenses)) * 100),
          status: pick([PnlStatus.draft, PnlStatus.issued]),
        },
      });
      pnlCount++;
    }
  }
  console.log(`Owner P&L statements: ${pnlCount}`);

  /* ── Community Posts ── */
  const POST_TITLES = [
    'Water Interruption Notice — Scheduled Maintenance', 'Annual Townhall Meeting', 'New Gym Equipment Arrived',
    'Fire Drill on Saturday 9AM', 'Holiday Lighting Ceremony', 'Pool Closure for Cleaning',
    'Garbage Collection Schedule Update', 'Welcome New Residents!',
  ];
  for (const title of POST_TITLES) {
    await prisma.communityPost.create({
      data: {
        title,
        body: faker.lorem.paragraph(),
        postType: pick([PostType.announcement, PostType.event, PostType.announcement]),
        audience: pick([Audience.all, Audience.building, Audience.property]),
        isPublished: true,
        scheduledAt: chance(0.3) ? faker.date.future({ years: 1 }) : null,
        authorId: admin.id,
      },
    });
  }

  /* ── Amenities & Bookings ── */
  const amenityDefs: { name: string; type: AmenityType }[] = [
    { name: 'Olympic Lap Pool', type: AmenityType.pool },
    { name: 'Fitness Gym', type: AmenityType.gym },
    { name: 'Function Hall A', type: AmenityType.function_room },
    { name: 'Function Hall B', type: AmenityType.function_room },
    { name: 'Meditation Garden', type: AmenityType.garden },
    { name: 'Visitor Parking', type: AmenityType.parking },
  ];
  const amenityRecs: any[] = [];
  for (const a of amenityDefs) {
    amenityRecs.push(
      await prisma.amenity.create({
        data: {
          name: a.name,
          type: a.type,
          description: faker.lorem.sentence(),
          capacity: faker.number.int({ min: 10, max: 200 }),
          location: pick(STREETS),
          hourlyRate: a.type === AmenityType.function_room ? money(500, 3000) : null,
          isActive: true,
        },
      }),
    );
  }
  for (const resident of pickN(residents, Math.min(10, residents.length))) {
    const bookings = faker.number.int({ min: 1, max: 3 });
    for (let b = 0; b < bookings; b++) {
      const amenity = pick(amenityRecs);
      const start = faker.date.soon({ days: 30 });
      const end = new Date(start);
      end.setHours(end.getHours() + faker.number.int({ min: 1, max: 4 }));
      await prisma.amenityBooking.create({
        data: {
          amenityId: amenity.id,
          tenantId: tenant.id,
          unitId: pick(allUnits).id,
          bookingStart: start,
          bookingEnd: end,
          status: pick([BookingStatus.confirmed, BookingStatus.completed, BookingStatus.pending, BookingStatus.cancelled]),
          totalAmount: amenity.hourlyRate ?? null,
          notes: chance(0.5) ? faker.lorem.sentence() : null,
        },
      });
    }
  }
  console.log('Community posts, amenities & bookings created');

  /* ── Service Requests + Work Orders ── */
  const serviceCats = [ServiceCategory.plumbing, ServiceCategory.electrical, ServiceCategory.hvac, ServiceCategory.general, ServiceCategory.pest, ServiceCategory.elevator];
  const woStatusByRequest: Record<string, string> = {
    open: 'scheduled',
    assigned: 'scheduled',
    in_progress: 'in_progress',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  for (let s = 0; s < 18; s++) {
    const resident = pick(residents);
    const unit = pick(allUnits);
    const status = pick([ServiceStatus.open, ServiceStatus.assigned, ServiceStatus.in_progress, ServiceStatus.completed, ServiceStatus.cancelled]);
    const req = await prisma.serviceRequest.create({
      data: {
        tenantId: tenant.id,
        unitId: unit.id,
        propertyId: unit.propertyId,
        category: pick(serviceCats),
        priority: pick([Priority.low, Priority.medium, Priority.high, Priority.emergency]),
        description: faker.lorem.sentence({ min: 8, max: 20 }),
        status,
        requestedAt: faker.date.past({ years: 1 }),
        scheduledAt: chance(0.5) ? faker.date.soon({ days: 14 }) : null,
        completedAt: status === ServiceStatus.completed ? faker.date.recent({ days: 30 }) : null,
        assignedToId: chance(0.6) ? pick(agents).user.id : null,
        assignedToType: chance(0.6) ? 'agent' : null,
        resolutionNotes: status === ServiceStatus.completed ? faker.lorem.sentence() : null,
      },
    });

    if (chance(0.85)) {
      const woStatus = woStatusByRequest[status] ?? 'scheduled';
      const est = money(1500, 85000);
      await prisma.maintenanceWorkOrder.create({
        data: {
          serviceRequestId: req.id,
          scheduledDate: chance(0.7) ? faker.date.soon({ days: 21 }) : null,
          estimatedCost: est,
          actualCost: woStatus === 'completed' ? Math.round(est * (0.8 + Math.random() * 0.4)) : null,
          status: woStatus as any,
          completedDate: woStatus === 'completed' ? faker.date.recent({ days: 20 }) : null,
          notes: chance(0.5) ? faker.lorem.sentence() : null,
        },
      });
    }
  }
  console.log('Service requests + work orders created');

  /* ── Documents (owner + resident) ── */
  for (const owner of owners) {
    const prop = pick(properties);
    await prisma.documentVault.create({
      data: {
        ownerType: DocOwnerType.owner,
        ownerId: owner.id,
        documentType: pick([DocumentType.lease_agreement, DocumentType.title_deed, DocumentType.statement, DocumentType.insurance]),
        title: pick(['Deed of Absolute Sale', 'Lease Contract', 'Annual Statement', 'Property Insurance']),
        fileUrl: 'https://cdn.elite-realty.example/doc.pdf',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: faker.number.int({ min: 100_000, max: 5_000_000 }),
        uploadedById: admin.id,
        expiryDate: chance(0.3) ? faker.date.future({ years: 2 }) : null,
        isSigned: chance(0.7),
      },
    });
  }
  for (const resident of pickN(residents, Math.min(10, residents.length))) {
    await prisma.documentVault.create({
      data: {
        ownerType: DocOwnerType.tenant,
        ownerId: resident.id,
        documentType: pick([DocumentType.lease_agreement, DocumentType.id_proof, DocumentType.statement, DocumentType.insurance]),
        title: pick(['Signed Lease', 'Government ID', 'Billing Statement', 'Renter Insurance']),
        fileUrl: 'https://cdn.elite-realty.example/doc.pdf',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: faker.number.int({ min: 100_000, max: 5_000_000 }),
        uploadedById: admin.id,
        isSigned: chance(0.6),
      },
    });
  }

  /* ── Statements of Account ── */
  for (const resident of pickN(residents, Math.min(8, residents.length))) {
    const open = money(0, 20000);
    const billed = money(15000, 80000);
    const paidAmt = money(0, billed);
    await prisma.statementOfAccount.create({
      data: {
        tenantId: tenant.id,
        ownerId: resident.id,
        periodStart: faker.date.past({ years: 1 }),
        periodEnd: faker.date.recent({ days: 10 }),
        openingBalance: open,
        totalBilled: billed,
        totalPaid: paidAmt,
        closingBalance: round2(open + billed - paidAmt),
        status: pick(['draft', 'sent']),
      },
    });
  }

  /* ── Payment Reminders ── */
  for (const resident of pickN(residents, Math.min(8, residents.length))) {
    await prisma.paymentReminder.create({
      data: {
        tenantId: tenant.id,
        ownerId: resident.id,
        type: pick([ReminderType.pre_due, ReminderType.post_due, ReminderType.final_notice]),
        channel: pick([ReminderChannel.email, ReminderChannel.sms, ReminderChannel.portal]),
        scheduledAt: faker.date.soon({ days: 14 }),
        message: faker.lorem.sentence(),
        status: pick([ReminderStatus.pending, ReminderStatus.sent]),
        sentAt: chance(0.4) ? faker.date.recent({ days: 5 }) : null,
      },
    });
  }

  /* ── Collection Cases + Activities ── */
  const overdueResidents = pickN(residents, Math.min(6, residents.length));
  for (const resident of overdueResidents) {
    const lease = residentLeases[resident.id];
    let totalOutstanding = money(5000, 80000);
    if (lease) {
      const payments = await prisma.rentalPayment.findMany({
        where: { leaseAgreementId: lease.id, status: { in: ['overdue', 'pending'] } },
      });
      const outstanding = payments.reduce(
        (sum, p) => sum + (Number(p.amountDue) - Number(p.amountPaid ?? 0)),
        0,
      );
      if (outstanding > 0) totalOutstanding = outstanding;
    }
    const c = await prisma.collectionCase.create({
      data: {
        tenantId: tenant.id,
        leaseId: lease?.id ?? null,
        totalOutstanding,
        priority: pick([CollectionCasePriority.medium, CollectionCasePriority.high, CollectionCasePriority.critical]),
        status: pick([CollectionCaseStatus.open, CollectionCaseStatus.in_progress, CollectionCaseStatus.escalated]),
        assignedToId: pick(agents).user.id,
        nextActionDate: faker.date.soon({ days: 10 }),
      },
    });
    const acts = faker.number.int({ min: 1, max: 3 });
    for (let a = 0; a < acts; a++) {
      await prisma.collectionActivity.create({
        data: {
          collectionCaseId: c.id,
          activityType: pick([CollectionActivityType.call, CollectionActivityType.email, CollectionActivityType.letter, CollectionActivityType.visit]),
          performedById: admin.id,
          notes: faker.lorem.sentence(),
          outcome: pick(['no_answer', 'promised_payment', 'disputed', 'left_voicemail']),
          nextActionDate: chance(0.5) ? faker.date.soon({ days: 7 }) : null,
        },
      });
    }
  }

  /* ── Notifications ── */
  const notify = async (role: NotificationRole, userId: string | null, type: NotificationType, title: string, message: string) => {
    await prisma.notification.create({
      data: { role, userId, tenantId: tenant.id, ownerId: userId, type, title, message, refId: null, isRead: chance(0.4) },
    });
  };
  await notify(NotificationRole.admin, admin.id, NotificationType.system, 'Monthly AR Aging Report Ready', 'The AR aging report for this month is now available.');
  await notify(NotificationRole.owner, owners[0]?.id ?? null, NotificationType.announcement, 'Quarterly P&L Issued', 'Your quarterly profit & loss statement has been issued.');
  for (const r of pickN(residents, 6)) {
    await notify(NotificationRole.resident, r.id, NotificationType.rent_due, 'Rent Due Soon', 'Your monthly rent will be due in 5 days.');
  }
  console.log('Documents, statements, reminders, collections & notifications created');

  console.log('\n✅ Seed completed successfully.');
  console.log('\nLogin credentials:');
  console.log('  Super Admin : admin@elite-realty.com / Admin123!');
  console.log('  Property Mgr: pm@elite-realty.com / Admin123!');
  console.log('  Finance     : finance@elite-realty.com / Admin123!');
  console.log('  Agent       : agent1@elite-realty.com / Agent123!');
  console.log('  Owner       : owner1@elite-realty.com / Owner123!');
  console.log('  Resident    : resident1@elite-realty.com / Tenant123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
