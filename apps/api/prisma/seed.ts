import {
  PrismaClient,
  UserType,
  PropertyType,
  PropertyStatus,
  BuildingType,
  UnitType,
  UnitStatus,
  ProjectType,
  ProjectStatus,
  PhaseStatus,
  BudgetCategory,
  ContractorEngagementStatus,
  LeaseType,
  SchemeType,
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
  ApInvoiceStatus,
  PostType,
  Audience,
  DocumentType,
  DocOwnerType,
  SignatureStatus,
  PnlStatus,
  LeadStatus,
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
import mongoose from 'mongoose';

const prisma = new PrismaClient();

faker.seed(20260615);

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const pick = <T>(arr: T[]): T => faker.helpers.arrayElement(arr);
const pickN = <T>(arr: T[], n: number): T[] => faker.helpers.arrayElements(arr, n);
const chance = (p: number) => faker.number.float({ min: 0, max: 1 }) < p;
const money = (min: number, max: number) =>
  Math.round(faker.number.float({ min, max }) / 100) * 100;
const pct = (base: number, percent: number) => Math.round((base * percent) / 100);
const phPhone = () =>
  `+63 ${faker.string.numeric(3)} ${faker.string.numeric(3)} ${faker.string.numeric(4)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

const FILIPINO_FIRST = [
  'Juan',
  'Maria',
  'Jose',
  'Ana',
  'Antonio',
  'Luisa',
  'Carlos',
  'Isabel',
  'Miguel',
  'Carmen',
  'Ramon',
  'Teresa',
  'Manuel',
  'Sofia',
  'Pedro',
  'Elena',
  'Ricardo',
  'Gloria',
  'Eduardo',
  'Luzviminda',
  'Felipe',
  'Corazon',
  'Emilio',
  'Lourdes',
  'Danny',
  'Angela',
  'Bienvenido',
  'Marlene',
  'Noli',
  'Perlita',
  'Ronaldo',
  'Imelda',
  'Andres',
  'Josephine',
  'Paolo',
  'Katrina',
  'Gabriel',
  'Beatriz',
];
const FILIPINO_LAST = [
  'Santos',
  'Reyes',
  'Cruz',
  'Bautista',
  'Gonzales',
  'Mendoza',
  'Garcia',
  'Tolentino',
  'Aquino',
  'Villanueva',
  'Navarro',
  'Dela Cruz',
  'Magsaysay',
  'Lopez',
  'Fernandez',
  'Ramirez',
  'Torres',
  'Rivera',
  'Santiago',
  'Dizon',
  'Sarmiento',
  'Villamor',
  'Alcantara',
  'Castillo',
  'David',
  'Guzman',
  'Jimenez',
  'Mercado',
  'Palma',
  'Quiros',
];

const name = () => `${pick(FILIPINO_FIRST)} ${pick(FILIPINO_LAST)}`;
const person = () => {
  const first = pick(FILIPINO_FIRST);
  const last = pick(FILIPINO_LAST);
  return {
    first,
    last,
    email: `${first}.${last}.${faker.string.alphanumeric(4)}`.toLowerCase() + '@elite-realty.com',
  };
};

const DEVELOPERS = [
  'Ayala Land Premier',
  'Alveo Land',
  'Avida Land',
  'DMCI Homes',
  'Megaworld Corporation',
  'SM Development Corporation',
  'Robinsons Land',
  'Vista Land & Lifescapes',
  'Filinvest Land',
  'Shang Properties',
  'Century Properties',
  'Rockwell Land',
];

const PROJECTS = [
  { name: 'The Pinnacle Towers', code: 'TPT', type: ProjectType.high_rise, city: 'Makati City' },
  {
    name: 'Aura Executive Estates',
    code: 'AEE',
    type: ProjectType.village,
    city: 'Sta. Rosa Laguna',
  },
  {
    name: 'Serenade Residences',
    code: 'SER',
    type: ProjectType.commercial_complex,
    city: 'Taguig City',
  },
  { name: 'Vanguard North', code: 'VAN', type: ProjectType.mid_rise, city: 'Quezon City' },
];

const BUILDINGS = [
  { name: 'Tower 1', code: 'T1', type: BuildingType.tower },
  { name: 'Tower 2', code: 'T2', type: BuildingType.tower },
  { name: 'Parkview Cluster', code: 'PVC', type: BuildingType.cluster },
  { name: 'Garden Block', code: 'GB', type: BuildingType.block },
  { name: 'The Rise', code: 'TR', type: BuildingType.mid_rise },
];

const STREETS = [
  'Ayala Avenue',
  'EDSA',
  'C5 Road',
  'Commonwealth Avenue',
  'Taft Avenue',
  'Roxas Boulevard',
  'McKinley Parkway',
  '32nd Street BGC',
  'Alabang-Zapote Road',
];
const CITIES = [
  'Makati City',
  'Taguig City',
  'Quezon City',
  'Mandaluyong City',
  'Pasig City',
  'Muntinlupa City',
  'Parañaque City',
  'Las Piñas City',
  'Sta. Rosa Laguna',
  'Cebu City',
  'Davao City',
];

/* ------------------------------------------------------------------ *
 * Mortgage amortization builder (mirrors fixed MortgageService)
 * ------------------------------------------------------------------ */

function buildAmortization(loanAmount: number, annualRatePct: number, n: number) {
  const i = annualRatePct / 100 / 12;
  const roundedPayment =
    i === 0
      ? round2(loanAmount / n)
      : round2((loanAmount * i * Math.pow(1 + i, n)) / (Math.pow(1 + i, n) - 1));
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
    'notification',
    'lead',
    'collectionActivity',
    'collectionCase',
    'collectionCaseNote',
    'statementOfAccount',
    'paymentReminder',
    'arArrangementInstallment',
    'arPayment',
    'arPaymentArrangement',
    'arInvoice',
    'arCollectionAction',
    'titleTransfer',
    'rtoEquityLedger',
    'rtoPaymentAllocation',
    'rtoContract',
    'mortgageAmortizationSchedule',
    'mortgageScenario',
    'rentalPayment',
    'leaseAgreement',
    'reservation',
    'scheme',
    'consumptionReading',
    'utilityBill',
    'utilityMeter',
    'utilityRate',
    'agentCommissionRelease',
    'agentTransaction',
    'agentLicenseRenewal',
    'agentCommission',
    'realEstateAgent',
    'contractorPayment',
    'contractorEngagement',
    'budgetLineItem',
    'budget',
    'phase',
    'contractor',
    'documentSignature',
    'documentVault',
    'communityPost',
    'amenityBooking',
    'amenity',
    'maintenanceWorkOrder',
    'serviceRequest',
    'ownerPnlStatement',
    'propertyImage',
    'unitImage',
    'unit',
    'floor',
    'building',
    'property',
    'project',
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
  if (existingUsers > 0 && process.env.FORCE_RESEED !== '1') {
    console.log(
      'Database already seeded (users exist) — skipping seed. Set FORCE_RESEED=1 to override.\n',
    );
    return;
  }

  console.log('Seeding Aetherouxe with realistic, portal-rich Filipino data...\n');
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
          tradeName: 'Aetherouxe Estates',
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

  const admin = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: 'admin@elite-realty.com',
      passwordHash: hash,
      userType: UserType.super_admin,
      firstName: 'Erwin',
      lastName: 'Ceniza',
      phone: phPhone(),
    },
  });

  // Base Chart of Accounts
  console.log('Seeding Chart of Accounts...');
  const coas = [
    { accountCode: '1000', name: 'Operating Cash', type: 'asset' as any },
    { accountCode: '1200', name: 'Accounts Receivable', type: 'asset' as any },
    { accountCode: '2000', name: 'Accounts Payable', type: 'liability' as any },
    { accountCode: '4000', name: 'Rental Income', type: 'revenue' as any },
    { accountCode: '4100', name: 'Sales Income', type: 'revenue' as any },
    { accountCode: '5000', name: 'Maintenance Expense', type: 'expense' as any },
    { accountCode: '5100', name: 'Commission Expense', type: 'expense' as any },
  ];

  for (const acc of coas) {
    await prisma.chartOfAccount.upsert({
      where: { tenantId_accountCode: { tenantId: tenant.id, accountCode: acc.accountCode } },
      update: {},
      create: {
        tenantId: tenant.id,
        accountCode: acc.accountCode,
        name: acc.name,
        type: acc.type,
      },
    });
  }

  // Financial Mappings
  const cashAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '1000' },
  });
  const arAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '1200' },
  });
  const apAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '2000' },
  });
  const rentAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '4000' },
  });
  const salesAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '4100' },
  });
  const maintAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '5000' },
  });
  const commAcc = await prisma.chartOfAccount.findFirst({
    where: { tenantId: tenant.id, accountCode: '5100' },
  });

  if (cashAcc && arAcc && apAcc && rentAcc && salesAcc && maintAcc && commAcc) {
    await prisma.financialMapping.deleteMany({ where: { tenantId: tenant.id } });
    await prisma.financialMapping.createMany({
      data: [
        {
          tenantId: tenant.id,
          transactionType: 'WORK_ORDER_COMPLETED',
          debitAccountId: maintAcc.id,
          creditAccountId: apAcc.id,
        },
        {
          tenantId: tenant.id,
          transactionType: 'COMMISSION_APPROVED',
          debitAccountId: commAcc.id,
          creditAccountId: apAcc.id,
        },
        {
          tenantId: tenant.id,
          transactionType: 'COMMISSION_ACCRUAL',
          debitAccountId: commAcc.id,
          creditAccountId: apAcc.id,
        },
        {
          tenantId: tenant.id,
          transactionType: 'SALE_CONTRACT_SIGNED',
          debitAccountId: arAcc.id,
          creditAccountId: salesAcc.id,
        },
      ],
    });
  }

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
  const agentTiers = [
    AgentTier.team_lead,
    AgentTier.senior,
    AgentTier.senior,
    AgentTier.junior,
    AgentTier.external_broker,
  ];
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
        managerId: i === 0 ? null : (agents[0]?.agent.id ?? null),
      },
    });
    // license renewals
    const exp = faker.date.soon({ days: 400 });
    const status =
      exp < new Date()
        ? 'expired'
        : exp < faker.date.soon({ days: 60 })
          ? 'expiring_soon'
          : 'compliant';
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
  console.log(
    `Users: 1 super_admin, 1 PM, 1 finance, ${agents.length} agents, ${owners.length} owners, ${residents.length} residents`,
  );

  /* ── Utility Rates (water + electricity) ── */
  await prisma.utilityRate.createMany({
    data: [
      {
        tenantId: tenant.id,
        meterType: UtilityType.water,
        ratePerUnit: 28.5,
        baseCharge: 50,
        effectiveFrom: faker.date.past({ years: 2 }),
      },
      {
        tenantId: tenant.id,
        meterType: UtilityType.electricity,
        ratePerUnit: 11.0,
        baseCharge: 70,
        effectiveFrom: faker.date.past({ years: 2 }),
      },
      {
        tenantId: tenant.id,
        meterType: UtilityType.water,
        ratePerUnit: 31.0,
        baseCharge: 55,
        effectiveFrom: faker.date.future({ years: 1 }),
      },
    ],
  });

  /* ── Projects, Phases, Budgets, Contractors ── */
  const contractors: any[] = [];
  const CONTRACTOR_NAMES = [
    'Megabuild Construction',
    'Prime Structures Inc.',
    'Cebu Engineering Works',
    'Luzon MEP Services',
    'Golden Ratio Interiors',
    'Verde Landscaping',
  ];
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
          specialization: pick([
            'General Contracting',
            'MEPF',
            'Fit-out',
            'Landscaping',
            'Structural',
          ]),
          isActive: true,
          isAgent: false,
        },
      }),
    );
  }

  // Convert an agent user into a contractor for agent payouts
  if (agents.length > 0) {
    const agentToConvert = agents[0];
    contractors.push(
      await prisma.contractor.create({
        data: {
          tenantId: tenant.id,
          companyName: `${agentToConvert.user.firstName} ${agentToConvert.user.lastName} Realty Services`,
          contactPerson: `${agentToConvert.user.firstName} ${agentToConvert.user.lastName}`,
          email: agentToConvert.user.email,
          phone: agentToConvert.user.phone,
          userId: agentToConvert.user.id,
          isAgent: true,
          isActive: true,
        },
      }),
    );
  }

  const projects: any[] = [];
  for (const proj of PROJECTS) {
    const status = pick([
      ProjectStatus.pre_selling,
      ProjectStatus.construction,
      ProjectStatus.fit_out,
      ProjectStatus.planning,
    ]);
    const project = await prisma.project.create({
      data: {
        tenantId: tenant.id,
        name: proj.name,
        description: `An address of distinction, ${proj.name} is a ${proj.type.replace('_', ' ')} development poised in the heart of ${proj.city}. Crafted for those who expect more, it pairs considered architecture with resort-grade amenities and the quiet confidence of a premier Philippine address — a landmark investment in modern living.`,
        projectType: proj.type,
        status,
        totalPhases: faker.number.int({ min: 2, max: 4 }),
        targetStartDate: faker.date.past({ years: 1 }),
        targetCompletionDate: faker.date.future({ years: 3 }),
        address: `${faker.number.int({ min: 10, max: 999 })} ${pick(STREETS)}, ${proj.city}`,
        projectLogoUrl: 'https://cdn.elite-realty.example/project.svg',
      },
    });

    // Project image gallery (deterministic picsum seeds for stable URLs).
    for (let i = 0; i < 3; i++) {
      await prisma.projectImage.create({
        data: {
          projectId: project.id,
          url: `https://picsum.photos/seed/project-${project.id}-${i}/1200/800`,
          sortOrder: i,
          isPrimary: i === 0,
          alt: `${project.name} image ${i + 1}`,
        },
      });
    }

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
      BudgetCategory.land_acquisition,
      BudgetCategory.construction,
      BudgetCategory.permits,
      BudgetCategory.architectural_design,
      BudgetCategory.engineering,
      BudgetCategory.interior_fit_out,
      BudgetCategory.landscaping,
      BudgetCategory.marketing,
      BudgetCategory.contingency,
      BudgetCategory.misc,
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
          status: pick([
            ContractorEngagementStatus.active,
            ContractorEngagementStatus.completed,
            ContractorEngagementStatus.pending,
          ]),
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

  /* ── Payment / Pricing Schemes ── */
  const byName = (n: string) => projects.find((p) => p.name === n) ?? null;
  const pinnacle = byName('The Pinnacle Towers');
  const aura = byName('Aura Executive Estates');
  const serenade = byName('Serenade Residences');
  const vanguard = byName('Vanguard North');

  const schemeDefs = [
    {
      code: 'SCH-STD-RENTAL',
      name: 'Standard Residential Lease',
      schemeType: SchemeType.standard_rental,
      projectId: null,
      remarks: '12-month lease, 2-month deposit, 5%/day late penalty after 3-day grace.',
      securityDepositPercent: '200',
      penaltyPercent: '5',
      graceDays: 3,
      agentCommissionPercentage: '1',
      companyCommissionPercentage: '0.5',
    },
    {
      code: 'SCH-CORP-RENTAL',
      name: 'Corporate Long-Term Lease',
      schemeType: SchemeType.standard_rental,
      projectId: pinnacle?.id ?? null,
      remarks: '3-year corporate lease with 3-month deposit and 5-day grace.',
      securityDepositPercent: '300',
      penaltyPercent: '3',
      graceDays: 5,
      agentCommissionPercentage: '1.5',
      companyCommissionPercentage: '0.5',
      // Split: listing agent (lead) + selling agent share the 1.5% payout.
      splitAgents: [
        { agentId: agents[0]?.agent.id, commissionPercentage: 1.0 },
        { agentId: agents[1]?.agent.id, commissionPercentage: 0.5 },
      ],
    },
    {
      code: 'SCH-SPOT-CASH',
      name: 'Spot Cash 10% Discount',
      schemeType: SchemeType.spot_cash,
      projectId: null,
      remarks: 'Full payment within 30 days for 10% off the selling price.',
      discountPercent: '10',
      agentCommissionPercentage: '4',
      companyCommissionPercentage: '2',
      // Split: 2.5% to lead agent, 1.5% to co-broker.
      splitAgents: [
        { agentId: agents[0]?.agent.id, commissionPercentage: 2.5 },
        { agentId: agents[2]?.agent.id, commissionPercentage: 1.5 },
      ],
    },
    {
      code: 'SCH-INHOUSE-24',
      name: 'In-House 24-Month Installment',
      schemeType: SchemeType.installment,
      projectId: aura?.id ?? null,
      remarks: '20% DP over 24 months, 80% balance on turnover.',
      dpNumberOfPayments: 24,
      dpNumberOfDaysFromDp: 30,
      eqPaymentPercentage: '20',
      eqMonthlyAmortPercentage: '80',
      eqNumberOfPayments: 24,
      eqDownpaymentPercentage: '20',
      blPaymentPercentage: '80',
      blMiscPercentage: '8.5',
      blNumberOfPayments: 1,
      agentCommissionPercentage: '4',
      companyCommissionPercentage: '2',
    },
    {
      code: 'SCH-INHOUSE-60',
      name: 'In-House 60-Month Deferred',
      schemeType: SchemeType.installment,
      projectId: serenade?.id ?? null,
      remarks: '10% DP, 90% spread over 60 months, no balloon.',
      dpNumberOfPayments: 12,
      dpNumberOfDaysFromDp: 30,
      eqPaymentPercentage: '10',
      eqMonthlyAmortPercentage: '90',
      eqNumberOfPayments: 60,
      eqDownpaymentPercentage: '10',
      blPaymentPercentage: '0',
      blMiscPercentage: '8.5',
      blNumberOfPayments: 1,
      discountPercent: '0',
      agentCommissionPercentage: '3.5',
      companyCommissionPercentage: '2',
    },
    {
      code: 'SCH-MORTGAGE-BDO',
      name: 'Bank Mortgage Assisted (BDO)',
      schemeType: SchemeType.mortgage_assisted,
      projectId: vanguard?.id ?? null,
      remarks: '20% DP in-house over 12 months; 80% via bank at 7% for 20 years.',
      dpNumberOfPayments: 12,
      dpNumberOfDaysFromDp: 30,
      mortgageDownPaymentPercent: '20',
      interestRatePercent: '7',
      loanTermMonths: 240,
      blPaymentPercentage: '80',
      blMiscPercentage: '8.5',
      agentCommissionPercentage: '3.5',
      companyCommissionPercentage: '2',
    },
    {
      code: 'SCH-MORTGAGE-PAGIBIG',
      name: 'Pag-IBIG Housing Loan',
      schemeType: SchemeType.mortgage_assisted,
      projectId: null,
      remarks: '10% DP; 90% via Pag-IBIG at 6.25% for 30 years.',
      dpNumberOfPayments: 12,
      dpNumberOfDaysFromDp: 30,
      mortgageDownPaymentPercent: '10',
      interestRatePercent: '6.25',
      loanTermMonths: 360,
      blPaymentPercentage: '90',
      blMiscPercentage: '8.5',
      agentCommissionPercentage: '3',
      companyCommissionPercentage: '1.5',
    },
    {
      code: 'SCH-RTO-5YR',
      name: 'Rent-to-Own 5-Year Path',
      schemeType: SchemeType.rent_to_own,
      projectId: aura?.id ?? null,
      remarks: 'Option fee 2%; 30% of rent accrues as equity; purchase option matures in 5 years.',
      optionFeePercent: '2',
      equityAccumulationPercent: '30',
      targetPurchaseYears: 5,
      penaltyPercent: '5',
      graceDays: 5,
      agentCommissionPercentage: '3',
      companyCommissionPercentage: '1.5',
    },
  ];

  const schemes: any[] = [];
  for (const s of schemeDefs) {
    // Default: a single lead agent carries the full commission.
    // Schemes may declare `splitAgents` to model a real split-commission deal
    // (e.g. a listing agent + a selling agent sharing the payout).
    const { splitAgents, ...schemeData } = s as any;
    const assignedAgents =
      splitAgents && splitAgents.length > 0
        ? splitAgents
        : [
            {
              agentId: agents[0]?.agent.id,
              commissionPercentage: agents[0]?.agent.commissionRateDefault ?? 3,
            },
          ];
    const leadAgentId = assignedAgents[0]!.agentId;
    schemes.push(
      await prisma.scheme.create({
        data: {
          ...schemeData,
          agentId: leadAgentId,
          assignedAgents,
        } as any,
      }),
    );
  }
  const schemesByType: Record<string, any[]> = {};
  for (const s of schemes) {
    (schemesByType[s.schemeType] ??= []).push(s);
  }
  console.log(`Schemes: ${schemes.length}`);

  /* ── Properties, Buildings, Floors, Units ── */
  const propertyTypeOptions = [
    PropertyType.condo_unit,
    PropertyType.house_and_lot,
    PropertyType.townhouse,
    PropertyType.commercial_space,
    PropertyType.parking_slot,
  ];
  // Unit types that make sense for each property type
  const unitTypesByProperty: Record<PropertyType, UnitType[]> = {
    [PropertyType.condo_unit]: [
      UnitType.studio,
      UnitType.one_br,
      UnitType.two_br,
      UnitType.three_br,
      UnitType.penthouse,
    ],
    [PropertyType.house_and_lot]: [UnitType.two_br, UnitType.three_br],
    [PropertyType.townhouse]: [UnitType.two_br, UnitType.three_br],
    [PropertyType.commercial_space]: [UnitType.commercial],
    [PropertyType.parking_slot]: [UnitType.parking],
  };

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
        name: `${project.name} · ${bldg.name}`,
        buildingType: bldg.type,
        floorCount: faker.number.int({ min: 6, max: 40 }),
        unitCount: faker.number.int({ min: 20, max: 120 }),
        address: project.address!,
      },
    });

    // Building image gallery.
    for (let i = 0; i < 3; i++) {
      await prisma.buildingImage.create({
        data: {
          buildingId: building.id,
          url: `https://picsum.photos/seed/building-${building.id}-${i}/1200/800`,
          sortOrder: i,
          isPrimary: i === 0,
          alt: `${building.name} image ${i + 1}`,
        },
      });
    }

    // Floors belong to the building (created once, shared by all its properties)
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

    // Real-world ruling: a Property is the titled/sellable wrapper.
    // The normal case is 1 Property = 1 Unit = 1 Title. Occasionally a property
    // bundles a residential unit with its own parking slot under a single title.
    const numProps = faker.number.int({ min: 8, max: 16 });
    for (let pr = 0; pr < numProps; pr++) {
      const ptype = pick(propertyTypeOptions);
      // The primary (titled) unit type must match the property type
      const primaryUnitType = pick(unitTypesByProperty[ptype]);
      const unitNo = String(pr + 1 + faker.number.int({ min: 0, max: 800 })).padStart(3, '0');
      const propertyCode = `${projCode}-${bldg.code}-${unitNo}`;

      // Property status drives the unit status (a property IS its unit, normally)
      const propStatus = pick([
        PropertyStatus.available,
        PropertyStatus.available,
        PropertyStatus.reserved,
        PropertyStatus.sold,
        PropertyStatus.rented,
        PropertyStatus.rto_active,
      ]);
      const unitStatusFor = (s: PropertyStatus): UnitStatus => {
        switch (s) {
          case PropertyStatus.sold:
            return UnitStatus.occupied;
          case PropertyStatus.rented:
            return UnitStatus.rented;
          case PropertyStatus.rto_active:
            return UnitStatus.rto_active;
          case PropertyStatus.reserved:
            return UnitStatus.reserved;
          case PropertyStatus.under_maintenance:
            return UnitStatus.under_maintenance;
          default:
            return UnitStatus.available;
        }
      };

      const property = await prisma.property.create({
        data: {
          tenantId: tenant.id,
          projectId: project.id,
          propertyCode,
          propertyType: ptype,
          status: propStatus,
          specsDocumentId: null,
        },
      });

      // Build the unit list for this property: the titled primary unit, plus an
      // optional bundled parking slot for residential titles (~15%).
      const unitPlans: UnitType[] = [primaryUnitType];
      const canBundleParking =
        ptype === PropertyType.condo_unit ||
        ptype === PropertyType.house_and_lot ||
        ptype === PropertyType.townhouse;
      if (canBundleParking && chance(0.15)) {
        unitPlans.push(UnitType.parking);
      }

      let primaryUnit: any = null;
      for (let ui = 0; ui < unitPlans.length; ui++) {
        const ut = unitPlans[ui]!;
        const floor = ut === UnitType.parking ? floors[0]! : pick(floors);
        const bedrooms =
          ut === UnitType.studio || ut === UnitType.commercial || ut === UnitType.parking
            ? 0
            : ut === UnitType.one_br
              ? 1
              : ut === UnitType.two_br
                ? 2
                : 3;
        const bathrooms =
          ut === UnitType.parking
            ? 0
            : ut === UnitType.studio || ut === UnitType.commercial
              ? 1
              : 2;
        const isSmall = ut === UnitType.parking || ut === UnitType.studio;
        const unit = await prisma.unit.create({
          data: {
            propertyId: property.id,
            buildingId: building.id,
            floorId: floor.id,
            unitNumber:
              ut === UnitType.parking
                ? `P-${unitNo}`
                : `${floor.floorNumber}${pick(['A', 'B', 'C', 'D'])}`,
            unitType: ut,
            status: unitStatusFor(propStatus),
            squareMeters:
              ut === UnitType.parking
                ? faker.number.int({ min: 12, max: 25 })
                : faker.number.int({ min: isSmall ? 24 : 45, max: 220 }),
            bedrooms,
            bathrooms,
            hasBalcony: ut === UnitType.parking ? false : chance(0.5),
            hasParking: ut === UnitType.parking ? false : chance(0.4),
            facingDirection: pick(['North', 'South', 'East', 'West', 'Corner']),
            listPrice: money(1_500_000, 25_000_000),
            lotValue: money(500_000, 8_000_000),
            buildingValue: money(1_000_000, 17_000_000),
          },
        });
        allUnits.push(unit);
        if (ui === 0) primaryUnit = unit;
      }

      // Lease/RTO targets are the titled property + its primary unit
      if (
        primaryUnit &&
        (propStatus === PropertyStatus.rented ||
          propStatus === PropertyStatus.rto_active ||
          chance(0.35))
      ) {
        leaseTargets.push({ property, unit: primaryUnit });
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
    const leaseType = pick([
      LeaseType.standard_rental,
      LeaseType.standard_rental,
      LeaseType.corporate_lease,
      LeaseType.rent_to_own,
    ]);
    const monthlyRent = money(15000, 120000);
    const startDate = faker.date.past({ years: 1 });
    const endDate = new Date(startDate);
    endDate.setFullYear(endDate.getFullYear() + (leaseType === LeaseType.corporate_lease ? 3 : 1));

    const schemeTypeForLease =
      leaseType === LeaseType.rent_to_own ? SchemeType.rent_to_own : SchemeType.standard_rental;
    const matchingSchemes = schemesByType[schemeTypeForLease] ?? [];
    const chosenScheme = matchingSchemes.length ? pick(matchingSchemes) : null;

    const lease = await prisma.leaseAgreement.create({
      data: {
        propertyId: target.property.id,
        unitId: target.unit?.id,
        unitLabel: target.unit?.unitNumber,
        tenantUserId: resident.id,
        leaseType,
        schemeId: chosenScheme?.id ?? null,
        schemeType: chosenScheme?.schemeType ?? null,
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
      const payments = await prisma.rentalPayment.findMany({
        where: { leaseAgreementId: lease.id, status: 'paid' },
      });
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
      await prisma.rtoContract.update({
        where: { id: rto.id },
        data: { accumulatedEquity: running },
      });
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
        data: rows.map((r) => {
          const periodDate = new Date(startDate);
          periodDate.setMonth(periodDate.getMonth() + (r.periodNumber - 1));
          return { ...r, periodDate, mortgageScenarioId: scenario.id };
        }),
      });
      mortgageCount++;
    }
  }
  console.log(`Leases: ${leaseCount} | RTO: ${rtoCount} | Mortgage: ${mortgageCount}`);

  /* ── Sync Unit statuses from lease state ── */
  for (const unitId of leasedUnitIds) {
    const hasRto = rtoLeases.some((l) => l.unitId === unitId);
    await prisma.unit.update({
      where: { id: unitId },
      data: { status: hasRto ? 'rto_active' : 'occupied' },
    });
  }
  console.log(`Unit statuses synced (${leasedUnitIds.size} occupied/rto)`);

  /* ── Reservations (option holds) ──
   * Mirrors reservations.service.create/convert/cancel/expire: a reservation
   * holds a unit (unit.status -> reserved), carries an option fee derived from
   * the scheme's optionFeePercent (default 2%), and may collect the fee now
   * (issuing an AR `reservation` invoice). We seed a realistic spread of
   * statuses (reserved / converted / expired / cancelled) over currently
   * AVAILABLE units so the reservations module is populated and coherent.
   */
  const availableUnits = await prisma.unit.findMany({
    where: { status: 'available', propertyId: { not: null } },
    include: { property: true },
    take: 30,
  });
  const activeSchemes = schemes.filter((s) => s.isActive !== false);
  let reservationCount = 0;
  let reservationInvoiceCount = 0;

  // Deterministic stage to ensure a realistic spread of all statuses every run.
  const reserveStages: string[] = [
    'reserved',
    'reserved',
    'reserved',
    'converted',
    'expired',
    'cancelled',
  ];

  for (let ui = 0; ui < availableUnits.length; ui++) {
    const unit = availableUnits[ui]!;
    if (activeSchemes.length === 0) break;
    const scheme = pick(activeSchemes);
    const stage = reserveStages[ui % reserveStages.length]!;
    const holdDays = faker.number.int({ min: 15, max: 60 });
    const optionFeePct = scheme.optionFeePercent ? Number(scheme.optionFeePercent) : 2;
    const optionFee = round2((Number(unit.listPrice) * optionFeePct) / 100);
    const prospect = person();
    const collectNow = stage === 'reserved' && chance(0.6);

    // holdExpiry in the past for expired, near-future otherwise.
    const holdExpiry =
      stage === 'expired' ? faker.date.recent({ days: 20 }) : faker.date.soon({ days: holdDays });

    const res = await prisma.reservation.create({
      data: {
        unitId: unit.id,
        schemeId: scheme.id,
        tenantId: unit.property!.tenantId,
        prospectName: `${prospect.first} ${prospect.last}`,
        prospectContact: phPhone(),
        optionFeeAmount: optionFee,
        holdingFeeCollected: collectNow,
        holdDays,
        holdExpiry,
        status:
          stage === 'expired'
            ? 'expired'
            : stage === 'cancelled'
              ? 'cancelled'
              : stage === 'converted'
                ? 'converted'
                : 'reserved',
        notes:
          stage === 'cancelled'
            ? 'Cancelled by prospect.'
            : stage === 'expired'
              ? 'Hold lapsed without conversion.'
              : null,
      },
    });

    // For converted reservations, link to a real lease (mirrors the convert flow).
    if (stage === 'converted') {
      const existingLease = await prisma.leaseAgreement.findFirst({
        where: { unitId: unit.id },
      });
      if (existingLease) {
        await prisma.reservation.update({
          where: { id: res.id },
          data: { convertedLeaseId: existingLease.id },
        });
      }
    }
    reservationCount++;

    // Mirror the service: reserve the unit while the hold is active.
    if (stage === 'reserved' || stage === 'converted') {
      const newStatus = stage === 'converted' ? 'sold' : 'reserved';
      await prisma.unit.update({ where: { id: unit.id }, data: { status: newStatus } });
    }

    // Mirror the service: collect fee now -> AR reservation invoice.
    if (collectNow && optionFee > 0) {
      await prisma.arInvoice.create({
        data: {
          tenantId: unit.property!.tenantId,
          userId: unit.property!.tenantId,
          invoiceType: 'reservation' as any,
          referenceSource: `reservation:${res.id}`,
          invoiceNumber: `RES-INV-${faker.string.alphanumeric(8).toUpperCase()}`,
          amount: optionFee,
          dueDate: holdExpiry,
          status: 'pending',
          issuedDate: new Date(),
          notes: `Reservation option fee for unit ${unit.unitNumber} (prospect: ${prospect.first} ${prospect.last})`,
        },
      });
      reservationInvoiceCount++;
    }
  }
  console.log(
    `Reservations: ${reservationCount} (with ${reservationInvoiceCount} option-fee AR invoices)`,
  );

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
          data: {
            meterId: meter.id,
            readingDate: periodEnd,
            value: current,
            reader: chance(0.5) ? 'meter_reader' : null,
            note: null,
          },
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
      const status: InvoiceStatus = paid
        ? InvoiceStatus.paid
        : due < new Date()
          ? InvoiceStatus.overdue
          : InvoiceStatus.pending;
      const inv = await prisma.arInvoice.create({
        data: {
          tenantId: tenant.id,
          userId: resident.id,
          invoiceType: pick([
            InvoiceType.rental,
            InvoiceType.utility_water,
            InvoiceType.utility_electricity,
            InvoiceType.association_dues,
            InvoiceType.late_fee,
          ]),
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

  /* ── Agent Commissions, Transactions, Releases ──
   *
   * This block mirrors the runtime commission workflow so the seed is fully
   * coherent with the live services (agent-transactions.service + commission-releases.service):
   *
   *   1. A commission is APPROVED  -> an AP Invoice (accrual) is created against
   *      the agent (as a Contractor/vendor) in `pending_approval`, plus a GL
   *      journal entry (Debit Commission Expense / Credit Accounts Payable).
   *   2. A commission is PAID      -> an AP Disbursement is recorded against that
   *      invoice (invoice marked `paid`) and a payment GL entry is posted
   *      (Debit AP / Credit Cash). Commission releases are the per-payment record.
   *
   * Every agent therefore also exists as a `Contractor` (vendor) so AP links resolve.
   */
  const commissionRules = [
    await prisma.agentCommission.create({
      data: {
        tenantId: tenant.id,
        name: 'Default Residential',
        agentTier: null,
        propertyType: null,
        commissionType: CommissionType.percentage_of_sale,
        commissionValue: '3',
        isActive: true,
      },
    }),
    await prisma.agentCommission.create({
      data: {
        tenantId: tenant.id,
        name: 'Luxury High-Rise Bonus',
        agentTier: AgentTier.team_lead,
        propertyType: PropertyType.condo_unit,
        commissionType: CommissionType.percentage_of_sale,
        commissionValue: '5',
        isActive: true,
      },
    }),
    await prisma.agentCommission.create({
      data: {
        tenantId: tenant.id,
        name: 'Rental Lease Commission',
        propertyType: null,
        commissionType: CommissionType.percentage_of_rent,
        commissionValue: '1',
        isActive: true,
      },
    }),
    await prisma.agentCommission.create({
      data: {
        tenantId: tenant.id,
        name: 'Tiered Sales',
        propertyType: PropertyType.house_and_lot,
        commissionType: CommissionType.tiered,
        commissionValue: JSON.stringify([
          { upto: 5000000, rate: 3 },
          { upto: 10000000, rate: 4 },
          { upto: null, rate: 5 },
        ]),
        isActive: true,
      },
    }),
  ];

  const properties = await prisma.property.findMany({ take: 12 });

  /* ── Property & Unit Showcase Images ── */
  const UNSPLASH_PROPERTY = [
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800',
    'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800',
    'https://images.unsplash.com/photo-1582407947092-a5f9c8380be7?w=800',
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
  ];
  const UNSPLASH_UNIT = [
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600',
    'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600',
    'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=600',
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600',
    'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=600',
    'https://images.unsplash.com/photo-1616137466211-f73a09e5f6e9?w=600',
  ];
  const PROP_ALTS = [
    'Building exterior',
    'Lobby entrance',
    'Facade view',
    'Tower overview',
    'Aerial view',
    'Pool area',
    'Garden view',
    'Parking area',
    'Rooftop view',
    'Neighborhood',
  ];
  const UNIT_ALTS = [
    'Living room',
    'Kitchen',
    'Bedroom',
    'Bathroom',
    'Balcony view',
    'Dining area',
    'Study room',
    'Unit interior',
  ];

  // Property + unit image galleries (deterministic picsum seeds, every record covered).
  let imgCount = 0;
  for (const prop of properties) {
    for (let i = 0; i < 3; i++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: prop.id,
          url: `https://picsum.photos/seed/property-${prop.id}-${i}/1200/800`,
          alt: `${prop.propertyCode} image ${i + 1}`,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
      imgCount++;
    }
  }

  let unitImgCount = 0;
  for (const unit of allUnits) {
    const numImages = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < numImages; i++) {
      await prisma.unitImage.create({
        data: {
          unitId: unit.id,
          url: `https://picsum.photos/seed/unit-${unit.id}-${i}/1200/800`,
          alt: `${unit.unitNumber} image ${i + 1}`,
          sortOrder: i,
          isPrimary: i === 0,
        },
      });
      unitImgCount++;
    }
  }
  console.log(`Showcase images: ${imgCount} property + ${unitImgCount} unit`);

  // Resolve (or create) the Contractor/vendor record for every agent so AP links resolve.
  const agentVendor = new Map<string, any>();
  for (const a of agents) {
    let vendor = await prisma.contractor.findFirst({
      where: { tenantId: tenant.id, userId: a.user.id },
    });
    if (!vendor) {
      vendor = await prisma.contractor.create({
        data: {
          tenantId: tenant.id,
          userId: a.user.id,
          companyName: `${a.user.firstName} ${a.user.lastName} Realty Services`,
          contactPerson: `${a.user.firstName} ${a.user.lastName}`,
          email: a.user.email,
          phone: a.user.phone,
          isAgent: true,
          isActive: true,
        },
      });
    }
    agentVendor.set(a.agent.id, vendor);
  }

  // Pre-fetch the GL accounts + mapping used for commission postings.
  const mapping =
    cashAcc && apAcc && commAcc
      ? await prisma.financialMapping.findFirst({
          where: { tenantId: tenant.id, transactionType: 'COMMISSION_ACCRUAL' },
        })
      : null;
  let apInvoiceSeq = 0;
  const nextApInvoiceNumber = () => {
    apInvoiceSeq += 1;
    return `AP-COMM-${new Date().getFullYear()}-${String(apInvoiceSeq).padStart(4, '0')}`;
  };

  const postCommissionAccrual = async (tx: any, vendor: any, propertyCode?: string) => {
    const amount = Number(tx.finalCommission ?? 0);
    if (amount <= 0) return null;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const invoice = await prisma.apInvoice.create({
      data: {
        tenantId: tenant.id,
        sourceType: 'COMMISSION',
        sourceId: tx.id,
        vendorId: vendor.id,
        invoiceNumber: nextApInvoiceNumber(),
        amount,
        dueDate,
        status: ApInvoiceStatus.pending_approval,
        notes: `Commission accrual for ${tx.transactionType} on property ${propertyCode ?? tx.propertyId}. Agent: ${vendor.companyName}`,
      },
    });
    if (mapping?.debitAccountId && mapping?.creditAccountId) {
      await prisma.journalEntry.create({
        data: {
          tenantId: tenant.id,
          reference: `COMM-ACC-${tx.id.substring(0, 8)}`,
          notes: `Commission accrual for agent ${vendor.companyName}`,
          lines: {
            create: [
              {
                accountId: mapping.debitAccountId,
                debitAmount: amount,
                description: 'Commission Expense',
              },
              {
                accountId: mapping.creditAccountId,
                creditAmount: amount,
                description: 'Commission Payable (AP)',
              },
            ],
          },
        },
      });
    }
    return invoice;
  };

  const postCommissionPayment = async (invoice: any, vendor: any, amount: number, ref: string) => {
    await prisma.apDisbursement.create({
      data: {
        invoiceId: invoice.id,
        amount,
        paymentMethod: pick(['bank_transfer', 'check', 'gcash']),
        reference: ref,
        notes: `Commission payout to agent. Ref: ${ref}`,
      },
    });
    if (cashAcc && apAcc) {
      await prisma.journalEntry.create({
        data: {
          tenantId: tenant.id,
          reference: `COMM-PAY-${ref}`,
          notes: `Commission payout for ${vendor.companyName}`,
          lines: {
            create: [
              { accountId: apAcc.id, debitAmount: amount, description: 'AP Disbursement' },
              { accountId: cashAcc.id, creditAmount: amount, description: 'Cash Outflow' },
            ],
          },
        },
      });
    }
  };

  let txCount = 0;
  let apInvoiceCount = 0;
  let disbursementCount = 0;

  /**
   * Seeds a single commission deal. For a split deal, `agentsWithPct` carries
   * more than one agent and the total commission is split across them by
   * percentage — producing one agentTransaction (and its own AP accrual /
   * disbursement trail) per participating agent, exactly like the runtime
   * `SalesService.recordSale()` split path.
   */
  const seedCommissionDeal = async (
    agentsWithPct: { agentId: string; commissionPercentage: number }[],
    property: any,
    txType: TransactionType,
    txAmount: number,
    rule: any,
  ) => {
    const totalPct = agentsWithPct.reduce((s, a) => s + (a.commissionPercentage || 0), 0) || 1;
    const totalCalc =
      rule.commissionType === CommissionType.tiered
        ? round2(txAmount * 0.04)
        : rule.commissionType === CommissionType.percentage_of_rent
          ? round2((txAmount * Number(rule.commissionValue)) / 100)
          : round2((txAmount * Number(rule.commissionValue)) / 100);

    for (const awp of agentsWithPct) {
      const vendor = agentVendor.get(awp.agentId);
      if (!vendor) continue;

      // Decide the lifecycle of this agent's share up-front.
      const stage = pick([
        'pending',
        'pending',
        'approved',
        'approved',
        'partially_paid',
        'fully_paid',
        'disputed',
      ]) as string;

      const shareCalc = round2((totalCalc * (awp.commissionPercentage || 0)) / totalPct);
      const finalCommission = stage === 'disputed' ? round2(shareCalc * 0.5) : shareCalc;

      const tx = await prisma.agentTransaction.create({
        data: {
          agentId: awp.agentId,
          transactionType: txType,
          propertyId: property.id,
          transactionAmount: txAmount,
          commissionRuleId: rule.id,
          calculatedCommission: shareCalc,
          finalCommission,
          status: stage === 'disputed' ? CommissionStatus.disputed : CommissionStatus.pending,
          transactionDate: faker.date.past({ years: 1 }),
        },
      });
      txCount++;

      // Approved & beyond -> create the AP accrual invoice (+ GL) for this agent's share.
      let invoice: any = null;
      if (stage !== 'pending' && stage !== 'disputed') {
        invoice = await postCommissionAccrual(tx, vendor, property.propertyCode);
        if (invoice) apInvoiceCount++;
      }

      // Paid stages -> create release(s) that fully/partially pay this share.
      if (stage === 'partially_paid' || stage === 'fully_paid') {
        const totalToPay =
          stage === 'fully_paid'
            ? finalCommission
            : round2(finalCommission * faker.number.float({ min: 0.3, max: 0.8 }));
        const numReleases = faker.number.int({ min: 1, max: 3 });
        let remaining = totalToPay;
        for (let r = 0; r < numReleases; r++) {
          const isLast = r === numReleases - 1;
          const amt = isLast ? remaining : round2(totalToPay / numReleases);
          remaining = round2(remaining - amt);
          const ref = `COMM-${faker.string.alphanumeric(8).toUpperCase()}`;
          const payDate = faker.date.recent({ days: 120 });
          await prisma.agentCommissionRelease.create({
            data: {
              agentTransactionId: tx.id,
              amount: amt,
              releaseDate: payDate,
              releaseType: pick(['initial', 'installment', 'final_payment', 'bonus']),
              agingBucket: 'Current',
              paymentMethod: pick(['bank_transfer', 'check', 'gcash']),
              paymentDate: payDate,
              paymentReference: ref,
              status: 'paid',
              approvedByUserId: chance(0.85) ? admin.id : null,
            },
          });
          if (invoice) {
            await postCommissionPayment(invoice, vendor, amt, ref);
            disbursementCount++;
          }
        }
        // Mark the AP invoice paid once released.
        if (invoice) {
          await prisma.apInvoice.update({
            where: { id: invoice.id },
            data: { status: ApInvoiceStatus.paid },
          });
        }
      }

      // Set the transaction's final status to match the chosen stage.
      const finalStatus =
        stage === 'approved'
          ? CommissionStatus.approved
          : stage === 'partially_paid'
            ? CommissionStatus.partially_paid
            : stage === 'fully_paid'
              ? CommissionStatus.fully_paid
              : stage === 'disputed'
                ? CommissionStatus.disputed
                : CommissionStatus.pending;
      if (finalStatus !== CommissionStatus.pending) {
        await prisma.agentTransaction.update({
          where: { id: tx.id },
          data: { status: finalStatus },
        });
      }
    }
  };

  // Helper to pick a transaction type + amount.
  const randomTx = () => {
    const txType = pick([
      TransactionType.sale,
      TransactionType.sale,
      TransactionType.rental_lease,
      TransactionType.rto_contract,
      TransactionType.lease_renewal,
    ]);
    const txAmount =
      txType === TransactionType.rental_lease ? money(15000, 120000) : money(3_000_000, 20_000_000);
    return { txType, txAmount };
  };

  // 1) Per-agent single-owner deals (baseline coverage).
  for (const agent of agents) {
    const txns = faker.number.int({ min: 3, max: 6 });
    for (let t = 0; t < txns; t++) {
      const { txType, txAmount } = randomTx();
      const rule = commissionRules[t % commissionRules.length]!;
      await seedCommissionDeal(
        [{ agentId: agent.agent.id, commissionPercentage: agent.agent.commissionRateDefault ?? 3 }],
        pick(properties),
        txType,
        txAmount,
        rule,
      );
    }
  }

  // 2) Explicit split-commission deals mirroring the two split schemes.
  //    These exercise the multi-agent ("cobroke") path end to end.
  const splitDeals = [
    // Corporate rental split: listing agent (agents[0]) + selling agent (agents[1]).
    {
      agentsWithPct: [
        { agentId: agents[0]?.agent.id, commissionPercentage: 1.0 },
        { agentId: agents[1]?.agent.id, commissionPercentage: 0.5 },
      ],
      rule: commissionRules.find((r) => r.name === 'Rental Lease Commission')!,
      txType: TransactionType.rental_lease,
      txAmount: money(15000, 120000),
    },
    // Spot-cash sale split: lead agent (agents[0]) + co-broker (agents[2]).
    {
      agentsWithPct: [
        { agentId: agents[0]?.agent.id, commissionPercentage: 2.5 },
        { agentId: agents[2]?.agent.id, commissionPercentage: 1.5 },
      ],
      rule: commissionRules[0]!,
      txType: TransactionType.sale,
      txAmount: money(5_000_000, 20_000_000),
    },
  ];
  for (const deal of splitDeals) {
    const reps = faker.number.int({ min: 2, max: 3 });
    for (let i = 0; i < reps; i++) {
      await seedCommissionDeal(
        deal.agentsWithPct,
        pick(properties),
        deal.txType,
        deal.txAmount,
        deal.rule,
      );
    }
  }
  console.log(
    `Agent commissions: ${txCount} transactions, ${apInvoiceCount} AP accruals, ${disbursementCount} disbursements`,
  );

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

  /* ── Amenities (created first so posts can reference them) ── */
  const amenityDefs: { name: string; type: AmenityType; blurb: string }[] = [
    { name: 'Olympic Lap Pool', type: AmenityType.pool, blurb: 'Lap Pool' },
    { name: 'Fitness Gym', type: AmenityType.gym, blurb: 'Gym' },
    { name: 'Function Hall A', type: AmenityType.function_room, blurb: 'Function Hall A' },
    { name: 'Function Hall B', type: AmenityType.function_room, blurb: 'Function Hall B' },
    { name: 'Meditation Garden', type: AmenityType.garden, blurb: 'Meditation Garden' },
    { name: 'Visitor Parking', type: AmenityType.parking, blurb: 'Visitor Parking' },
  ];
  const amenityRecs: any[] = [];
  for (const a of amenityDefs) {
    // Anchor each amenity to a real property so amenity-scoped posts link coherently.
    const anchorProp = pick(properties);
    amenityRecs.push(
      await prisma.amenity.create({
        data: {
          name: a.name,
          type: a.type,
          description: faker.lorem.sentence(),
          capacity: faker.number.int({ min: 10, max: 200 }),
          location: pick(STREETS),
          propertyId: anchorProp.id,
          hourlyRate: a.type === AmenityType.function_room ? money(500, 3000) : null,
          isActive: true,
        },
      }),
    );
  }

  /* ── Community Posts ──
   * Two coherent tiers:
   *   1. PER-AMENITY posts — one operational notice per amenity, scoped to that
   *      amenity's property (audience: property) so residents see relevant news.
   *   2. GENERAL community posts — portfolio-wide announcements/events
   *      (audience: all) plus a few property-scoped notices that are actually
   *      linked to a real property (no dangling audience:property with null FK).
   */
  const AMENITY_POSTS: Record<string, string[]> = {
    pool: [
      'Olympic Lap Pool — Temporary Closure for Drainage Maintenance',
      'Lap Pool New Operating Hours: 6AM to 10PM Daily',
    ],
    gym: ['Fitness Gym — New Equipment Now Available', 'Gym Etiquette Reminder & Peak-Hour Limits'],
    function_room: [
      'Function Hall Booking Guidelines & Rates',
      'Function Hall A Unavailable This Weekend — Private Event',
    ],
    garden: ['Meditation Garden Refresh — New Plantings Added'],
    parking: ['Visitor Parking Sticker Renewal Drive'],
  };

  for (const amenity of amenityRecs) {
    const titles = AMENITY_POSTS[amenity.type] ?? ['Amenity Update'];
    const title = pick(titles);
    await prisma.communityPost.create({
      data: {
        title,
        body: faker.lorem.paragraph(),
        postType: PostType.announcement,
        audience: Audience.property,
        propertyId: amenity.propertyId,
        isPublished: true,
        scheduledAt: chance(0.25) ? faker.date.future({ years: 1 }) : null,
        authorId: admin.id,
        moderationStatus: 'published',
        moderatedById: admin.id,
        moderatedAt: new Date(),
      },
    });
  }

  const GENERAL_POSTS = [
    { title: 'Water Interruption Notice — Scheduled Maintenance', type: PostType.announcement },
    { title: 'Annual Townhall Meeting', type: PostType.event },
    { title: 'Fire Drill on Saturday 9AM', type: PostType.announcement },
    { title: 'Holiday Lighting Ceremony', type: PostType.event },
    { title: 'Garbage Collection Schedule Update', type: PostType.announcement },
    { title: 'Welcome New Residents!', type: PostType.announcement },
  ];
  for (const p of GENERAL_POSTS) {
    const propertyScoped = p.type === PostType.announcement && chance(0.4);
    await prisma.communityPost.create({
      data: {
        title: p.title,
        body: faker.lorem.paragraph(),
        postType: p.type,
        audience: propertyScoped ? Audience.property : Audience.all,
        propertyId: propertyScoped ? pick(properties).id : null,
        isPublished: true,
        scheduledAt: chance(0.3) ? faker.date.future({ years: 1 }) : null,
        authorId: admin.id,
        moderationStatus: 'published',
        moderatedById: admin.id,
        moderatedAt: new Date(),
      },
    });
  }

  /* ── Amenity Bookings ── */
  const residentsWithLeases = residents.filter((r) => residentLeases[r.id]);
  for (const resident of pickN(residentsWithLeases, Math.min(10, residentsWithLeases.length))) {
    const lease = residentLeases[resident.id];
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
          unitId: lease.unitId ?? undefined,
          tenantName:
            `${resident.firstName ?? ''} ${resident.lastName ?? ''}`.trim() || resident.email,
          unitLabel: lease.unitLabel ?? undefined,
          bookingStart: start,
          bookingEnd: end,
          status: pick([
            BookingStatus.confirmed,
            BookingStatus.completed,
            BookingStatus.pending,
            BookingStatus.cancelled,
          ]),
          totalAmount: amenity.hourlyRate ?? null,
          notes: chance(0.5) ? faker.lorem.sentence() : null,
        },
      });
    }
  }
  console.log('Community posts, amenities & bookings created');

  /* ── Service Requests + Work Orders ── */
  const serviceCats = [
    ServiceCategory.plumbing,
    ServiceCategory.electrical,
    ServiceCategory.hvac,
    ServiceCategory.general,
    ServiceCategory.pest,
    ServiceCategory.elevator,
  ];
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
    const status = pick([
      ServiceStatus.open,
      ServiceStatus.assigned,
      ServiceStatus.in_progress,
      ServiceStatus.completed,
      ServiceStatus.cancelled,
    ]);
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
        ...(chance(0.6)
          ? chance(0.5)
            ? { assignedToId: pick(agents).user.id, assignedToType: 'agent' }
            : { assignedToId: pick(contractors).id, assignedToType: 'contractor' }
          : { assignedToId: null, assignedToType: null }),
        resolutionNotes: status === ServiceStatus.completed ? faker.lorem.sentence() : null,
      },
    });

    if (chance(0.85)) {
      const woStatus = woStatusByRequest[status] ?? 'scheduled';
      const est = money(1500, 85000);
      await prisma.maintenanceWorkOrder.create({
        data: {
          serviceRequestId: req.id,
          vendorId: pick(contractors).id,
          scheduledDate: chance(0.7) ? faker.date.soon({ days: 21 }) : null,
          estimatedCost: est,
          actualCost:
            woStatus === 'completed' ? Math.round(est * (0.8 + Math.random() * 0.4)) : null,
          status: woStatus as any,
          completedDate: woStatus === 'completed' ? faker.date.recent({ days: 20 }) : null,
          notes: chance(0.5) ? faker.lorem.sentence() : null,
        },
      });
    }
  }
  console.log('Service requests + work orders created');

  /* ── Leads (CRM) ──
   * Curated lead pipeline with realistic Filipino names, phone numbers,
   * source attributions, property matches, agent assignments, and notes.
   * Spread across all pipeline stages for meaningful demo data.
   */
  const propA = properties[0];
  const propB = properties[1];
  const propC = properties[2];
  const propD = properties[3];
  const propE = properties[4];
  const ag0 = agents[0]?.user; // team lead
  const ag1 = agents[1]?.user; // senior
  const ag2 = agents[2]?.user; // senior
  const ag3 = agents[3]?.user; // junior
  const ag4 = agents[4]?.user; // external broker

  const leadData = [
    {
      name: 'Maria Santos',
      email: 'maria.santos@gmail.com',
      phone: '+63 917 555 0101',
      source: 'website',
      propertyId: propA?.id ?? null,
      assignedToId: ag0?.id ?? null,
      status: 'qualified' as LeadStatus,
      notes:
        'Interested in 3BR unit at Lumina Residences. Pre-approved for bank financing. Follow up on required documents.',
    },
    {
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@yahoo.com',
      phone: '+63 918 555 0202',
      source: 'referral',
      propertyId: propB?.id ?? null,
      assignedToId: ag1?.id ?? null,
      status: 'contacted' as LeadStatus,
      notes:
        'Referred by Maria Santos. Looking for a studio unit near BGC. Budget 3-4M. Wants to schedule site visit.',
    },
    {
      name: 'Angela Reyes',
      email: 'angela.reyes@outlook.com',
      phone: '+63 919 555 0303',
      source: 'social_media',
      propertyId: propC?.id ?? null,
      assignedToId: ag2?.id ?? null,
      status: 'new' as LeadStatus,
      notes: 'DMed our Facebook page asking about RTO terms for a 2BR unit. Sent pricing brochure.',
    },
    {
      name: 'Roberto Garcia',
      email: 'r.garcia@gmail.com',
      phone: '+63 920 555 0404',
      source: 'walk_in',
      propertyId: propA?.id ?? null,
      assignedToId: ag0?.id ?? null,
      status: 'won' as LeadStatus,
      notes: 'Walked in on Saturday. Signed reservation for unit A-1201. Downpayment started.',
    },
    {
      name: 'Patricia Lim',
      email: 'p.lim@proton.me',
      phone: '+63 921 555 0505',
      source: 'website',
      propertyId: propD?.id ?? null,
      assignedToId: ag3?.id ?? null,
      status: 'qualified' as LeadStatus,
      notes:
        'Submitted inquiry form for townhouse units. OFW based in Singapore — wants investment property. Can pay spot cash.',
    },
    {
      name: 'Miguel Torres',
      email: 'miguel.torres@gmail.com',
      phone: '+63 922 555 0606',
      source: 'cold_call',
      propertyId: null,
      assignedToId: ag4?.id ?? null,
      status: 'lost' as LeadStatus,
      notes:
        'Cold call from property listing. Not interested — already bought from a competitor. Do not contact again.',
    },
    {
      name: 'Carmen Aquino',
      email: 'carmen.aquino@yahoo.com',
      phone: '+63 923 555 0707',
      source: 'referral',
      propertyId: propE?.id ?? null,
      assignedToId: ag1?.id ?? null,
      status: 'contacted' as LeadStatus,
      notes:
        'Referred by a current tenant. Wants to transfer to a bigger unit next quarter. Hold for now.',
    },
    {
      name: 'Daniel Ramos',
      email: 'dramos@outlook.com',
      phone: '+63 924 555 0808',
      source: 'website',
      propertyId: propB?.id ?? null,
      assignedToId: ag2?.id ?? null,
      status: 'new' as LeadStatus,
      notes: 'Submitted web form for duplex units. No response to follow-up email yet.',
    },
    {
      name: 'Sofia Mendoza',
      email: 'sofia.mendoza@gmail.com',
      phone: '+63 925 555 0909',
      source: 'social_media',
      propertyId: propC?.id ?? null,
      assignedToId: ag0?.id ?? null,
      status: 'won' as LeadStatus,
      notes: 'Instagram lead. Signed contract last week. Unit C-0802. Fully paid spot cash.',
    },
    {
      name: 'Eduardo Villanueva',
      email: 'ed.villanueva@gmail.com',
      phone: '+63 926 555 1010',
      source: 'walk_in',
      propertyId: propD?.id ?? null,
      assignedToId: ag3?.id ?? null,
      status: 'qualified' as LeadStatus,
      notes:
        'Walked in with spouse. Interested in pre-selling 3BR. Needs time to decide — target close by end of month.',
    },
    {
      name: 'Isabella Cruz',
      email: 'isabella.cruz@yahoo.com',
      phone: '+63 927 555 1111',
      source: 'cold_call',
      propertyId: propA?.id ?? null,
      assignedToId: ag4?.id ?? null,
      status: 'contacted' as LeadStatus,
      notes: 'Called from agent list. Expressed interest in condo units. Sent virtual tour link.',
    },
    {
      name: 'Fernando Bautista',
      email: 'f.bautista@outlook.com',
      phone: '+63 928 555 1212',
      source: 'website',
      propertyId: propE?.id ?? null,
      assignedToId: ag1?.id ?? null,
      status: 'new' as LeadStatus,
      notes: 'Inquiry about penthouse units. Requested price list via email. Awaiting response.',
    },
    {
      name: 'Ana Pascual',
      email: 'ana.pascual@gmail.com',
      phone: '+63 929 555 1313',
      source: 'referral',
      propertyId: propB?.id ?? null,
      assignedToId: ag2?.id ?? null,
      status: 'lost' as LeadStatus,
      notes:
        'Referred by Roberto Garcia. Met twice but chose a property in Cavite for lower price.',
    },
    {
      name: 'Ricardo Soriano',
      email: 'ricardo.soriano@gmail.com',
      phone: '+63 930 555 1414',
      source: 'social_media',
      propertyId: propC?.id ?? null,
      assignedToId: ag0?.id ?? null,
      status: 'won' as LeadStatus,
      notes:
        'Facebook ad lead. Converted after 2 site visits. Reservation signed, moved to sales pipeline.',
    },
  ];

  let leadCount = 0;
  for (const ld of leadData) {
    await prisma.lead.create({
      data: {
        tenantId: tenant.id,
        ...ld,
      },
    });
    leadCount++;
  }
  console.log(`Leads: ${leadCount}`);

  /* ── Documents (linked to properties, units, leases) ── */
  for (const owner of owners) {
    const prop = pick(properties);
    const ownerLeases = Object.values(residentLeases).filter((l) => l.propertyId === prop.id);
    const linkedLease = ownerLeases[0] ?? null;
    await prisma.documentVault.create({
      data: {
        ownerType: DocOwnerType.owner,
        ownerId: owner.id,
        documentType: pick([DocumentType.title_deed, DocumentType.insurance, DocumentType.permit]),
        title: pick([
          'Deed of Absolute Sale',
          'Property Insurance',
          'Building Permit',
          'Tax Declaration',
        ]),
        fileUrl: `https://cdn.elite-realty.example/${faker.string.alphanumeric(8)}.pdf`,
        fileName: `${faker.string.alphanumeric(8)}.pdf`,
        mimeType: 'application/pdf',
        fileSize: faker.number.int({ min: 100_000, max: 5_000_000 }),
        uploadedById: admin.id,
        expiryDate: chance(0.3) ? faker.date.future({ years: 2 }) : null,
        isSigned: chance(0.7),
        propertyId: prop.id,
        unitId: linkedLease?.unitId ?? null,
        leaseId: linkedLease?.id ?? null,
      },
    });
  }
  for (const resident of pickN(residents, Math.min(10, residents.length))) {
    const lease = residentLeases[resident.id];
    await prisma.documentVault.create({
      data: {
        ownerType: DocOwnerType.tenant,
        ownerId: resident.id,
        documentType: pick([
          DocumentType.lease_agreement,
          DocumentType.id_proof,
          DocumentType.insurance,
        ]),
        title: pick([
          'Signed Lease Agreement',
          'Government ID',
          'Renter Insurance',
          'Move-in Inspection',
        ]),
        fileUrl: `https://cdn.elite-realty.example/${faker.string.alphanumeric(8)}.pdf`,
        fileName: `${faker.string.alphanumeric(8)}.pdf`,
        mimeType: 'application/pdf',
        fileSize: faker.number.int({ min: 100_000, max: 5_000_000 }),
        uploadedById: admin.id,
        isSigned: chance(0.6),
        propertyId: lease?.propertyId ?? null,
        unitId: lease?.unitId ?? null,
        leaseId: lease?.id ?? null,
      },
    });
  }

  /* ── Statements of Account (linked to leases) ── */
  for (const resident of pickN(residents, Math.min(8, residents.length))) {
    const lease = residentLeases[resident.id];
    const open = money(0, 20000);
    const billed = money(15000, 80000);
    const paidAmt = money(0, billed);
    await prisma.statementOfAccount.create({
      data: {
        tenantId: tenant.id,
        ownerId: resident.id,
        propertyId: lease?.propertyId ?? null,
        leaseId: lease?.id ?? null,
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
        priority: pick([
          CollectionCasePriority.medium,
          CollectionCasePriority.high,
          CollectionCasePriority.critical,
        ]),
        status: pick([
          CollectionCaseStatus.open,
          CollectionCaseStatus.in_progress,
          CollectionCaseStatus.escalated,
        ]),
        assignedToId: pick(agents).user.id,
        nextActionDate: faker.date.soon({ days: 10 }),
      },
    });
    const acts = faker.number.int({ min: 1, max: 3 });
    for (let a = 0; a < acts; a++) {
      await prisma.collectionActivity.create({
        data: {
          collectionCaseId: c.id,
          activityType: pick([
            CollectionActivityType.call,
            CollectionActivityType.email,
            CollectionActivityType.letter,
            CollectionActivityType.visit,
          ]),
          performedById: admin.id,
          notes: faker.lorem.sentence(),
          outcome: pick(['no_answer', 'promised_payment', 'disputed', 'left_voicemail']),
          nextActionDate: chance(0.5) ? faker.date.soon({ days: 7 }) : null,
        },
      });
    }
  }

  /* ── Notifications ── */
  const notify = async (
    role: NotificationRole,
    userId: string | null,
    type: NotificationType,
    title: string,
    message: string,
  ) => {
    await prisma.notification.create({
      data: {
        role,
        userId,
        tenantId: tenant.id,
        ownerId: userId,
        type,
        title,
        message,
        refId: null,
        isRead: chance(0.4),
      },
    });
  };
  await notify(
    NotificationRole.admin,
    admin.id,
    NotificationType.system,
    'Monthly AR Aging Report Ready',
    'The AR aging report for this month is now available.',
  );
  await notify(
    NotificationRole.owner,
    owners[0]?.id ?? null,
    NotificationType.announcement,
    'Quarterly P&L Issued',
    'Your quarterly profit & loss statement has been issued.',
  );
  for (const r of pickN(residents, 6)) {
    await notify(
      NotificationRole.resident,
      r.id,
      NotificationType.rent_due,
      'Rent Due Soon',
      'Your monthly rent will be due in 5 days.',
    );
  }
  console.log('Documents, statements, reminders, collections & notifications created');

  /* ── Property Specs (MongoDB) ──
   * The admin/owner/resident UIs read property `description` and the
   * "Additional Details" panel from the MongoDB `property_specs` document
   * (keyed by propertyId), not from the Postgres `properties` table. Seed a
   * rich, type-appropriate spec for every property so those pages are not empty.
   */
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    await mongoose.connect(mongoUri);
    const SpecModel = mongoose.model(
      'PropertySpec',
      new mongoose.Schema(
        {
          propertyId: { type: String, required: true, unique: true },
          specs: { type: Object, default: {} },
          metadata: { type: Object, default: {} },
        },
        { collection: 'property_specs', timestamps: true },
      ),
    );

    // Idempotent reseed: drop any specs from prior runs (cleanup() only clears Postgres).
    await SpecModel.deleteMany({});

    const allProps = await prisma.property.findMany({});
    let specCount = 0;
    for (const prop of allProps) {
      const city = pick(CITIES);
      const yearBuilt = faker.number.int({ min: 2008, max: 2025 });
      const lotSize = `${faker.number.int({ min: 40, max: 600 })} sqm`;
      const totalSquareFeet = `${faker.number.int({ min: 300, max: 4500 })} sqft`;
      const baseSpecs: Record<string, any> = {
        description: `A meticulously maintained ${prop.propertyType.replace('_', ' ')} at ${prop.propertyCode}, ${city}. Offers resort-grade finishes, abundant natural light, and effortless access to premium amenities — an ideal address for discerning owners and tenants alike.`,
        yearBuilt,
        lotSize,
        totalSquareFeet,
        floorPlanImage: `https://picsum.photos/seed/floorplan-${prop.id}/800/600`,
      };

      // Type-specific "Additional Details" (mirrors the Edit Property form fields).
      if (prop.propertyType === PropertyType.condo_unit) {
        Object.assign(baseSpecs, {
          ceilingHeight: `${faker.number.float({ min: 2.4, max: 3.6, fractionDigits: 1 })} m`,
          finishType: pick(['Premium', 'Semi-furnished', 'Bare', 'Fully-furnished']),
          appliances: pick(['Refrigerator, Range, Hood', 'Refrigerator, Microwave', 'None']),
          ac: pick(['Split-type', 'Central', 'Window-type']),
          flooring: pick(['Engineered wood', 'Vinyl', 'Marble', 'Tiles']),
          smartHomeFeatures: pick(['Smart lock', 'None', 'Smart thermostat', 'CCTV ready']),
        });
      } else if (
        prop.propertyType === PropertyType.house_and_lot ||
        prop.propertyType === PropertyType.townhouse
      ) {
        Object.assign(baseSpecs, {
          lotArea: `${faker.number.int({ min: 80, max: 400 })} sqm`,
          floorArea: `${faker.number.int({ min: 120, max: 600 })} sqm`,
          bedrooms: faker.number.int({ min: 2, max: 5 }),
          bathrooms: faker.number.int({ min: 2, max: 4 }),
          garden: chance(0.6),
          garage: chance(0.7),
        });
      } else if (prop.propertyType === PropertyType.parking_slot) {
        Object.assign(baseSpecs, {
          dimensions: `${faker.number.int({ min: 2, max: 3 })}.${faker.number.int({ min: 2, max: 9 })} x ${faker.number.int({ min: 4, max: 6 })}.${faker.number.int({ min: 0, max: 9 })} m`,
          covered: chance(0.5),
          nearbyElevator: chance(0.7),
        });
      } else if (prop.propertyType === PropertyType.commercial_space) {
        Object.assign(baseSpecs, {
          floorArea: `${faker.number.int({ min: 50, max: 1200 })} sqm`,
          finishType: pick(['Bare', 'Semi-furnished', 'Fully-furnished']),
          ac: pick(['Central', 'Split-type', 'None']),
        });
      }

      await SpecModel.findOneAndUpdate(
        { propertyId: prop.id },
        { $set: { specs: baseSpecs, metadata: { seeded: true } } },
        { upsert: true, returnDocument: 'after' },
      );
      specCount++;
    }
    await mongoose.disconnect();
    console.log(`Property specs (MongoDB): ${specCount} documents`);
  }

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
