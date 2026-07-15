const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

const TENANT_DOMAIN = "ayala-land-premier";
const RESIDENT_PW = "Tenant123!";
const AGENT_PW = "Agent123!";

function daysFromNow(d) {
  const dt = new Date();
  dt.setDate(dt.getDate() + d);
  return dt;
}
function monthsAgo(n) {
  const dt = new Date();
  dt.setMonth(dt.getMonth() - n);
  return dt;
}
function addMonths(dt, n) {
  const c = new Date(dt);
  c.setMonth(c.getMonth() + n);
  return c;
}

async function main() {
  // ---- resolve tenant + admin ----
  const tenant = await prisma.tenant.findFirst({
    where: { domain: TENANT_DOMAIN },
  });
  if (!tenant) throw new Error("Tenant " + TENANT_DOMAIN + " not found");
  console.log("Seeding into tenant", tenant.id, tenant.name);

  // ---- clean prior demo data (idempotent) ----
  console.log("Cleaning prior demo data...");
  await prisma.rtoPaymentAllocation.deleteMany({ where: { rtoContract: { leaseAgreement: { property: { tenantId: tenant.id } } } } });
  await prisma.rtoEquityLedger.deleteMany({ where: { rtoContract: { leaseAgreement: { property: { tenantId: tenant.id } } } } });
  await prisma.rtoContract.deleteMany({ where: { leaseAgreement: { property: { tenantId: tenant.id } } } });
  await prisma.rentalPayment.deleteMany({ where: { leaseAgreement: { property: { tenantId: tenant.id } } } });
  await prisma.leaseAgreement.deleteMany({ where: { property: { tenantId: tenant.id } } });
  await prisma.utilityBill.deleteMany({ where: { property: { tenantId: tenant.id } } });
  await prisma.consumptionReading.deleteMany({ where: { meter: { propertyId: { in: (await prisma.property.findMany({ where: { tenantId: tenant.id }, select: { id: true } })).map(p => p.id) } } } });
  await prisma.utilityMeter.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.serviceRequest.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.agentTransaction.deleteMany({ where: { property: { tenantId: tenant.id } } });
  await prisma.agentLicenseRenewal.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.realEstateAgent.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.notification.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.agentCommission.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.unit.deleteMany({ where: { property: { tenantId: tenant.id } } });
  await prisma.floor.deleteMany({ where: { building: { tenantId: tenant.id } } });
  await prisma.building.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.property.deleteMany({ where: { tenantId: tenant.id } });
  await prisma.user.deleteMany({ where: { tenantId: tenant.id, email: { endsWith: "@demo.local" } } });

  // ---- tenants (residents + agents) ----
  const residentHash = await bcrypt.hash(RESIDENT_PW, 10);
  const agentHash = await bcrypt.hash(AGENT_PW, 10);

  // ---- properties + buildings + floors ----
  const propertyTypes = ["condo_unit", "house_and_lot", "townhouse", "commercial_space", "parking_slot"];
  const buildingTypes = ["tower", "mid_rise", "low_rise", "cluster", "block"];
  const propertyNames = [
    "Azure Residences", "Verdant Village", "Skyline Tower", "Maple Court",
    "Harbor Point", "Cedar Homes", "Lumina Plaza", "Olive Garden Estates",
  ];

  const properties = [];
  for (let i = 0; i < propertyNames.length; i++) {
    const code = "PR-" + String(i + 1).padStart(3, "0");
    const prop = await prisma.property.create({
      data: {
        tenantId: tenant.id,
        propertyCode: code,
        propertyType: propertyTypes[i % propertyTypes.length],
        status: "available",
      },
    });
    const building = await prisma.building.create({
      data: {
        tenantId: tenant.id,
        name: propertyNames[i],
        buildingType: buildingTypes[i % buildingTypes.length],
        floorCount: 1,
        unitCount: 8,
        address: (i + 1) + " Demo Street, Metro Manila",
      },
    });
    const floor = await prisma.floor.create({
      data: {
        buildingId: building.id,
        floorNumber: "G",
        sortOrder: 1,
      },
    });
    properties.push({ ...prop, buildingId: building.id, floorId: floor.id, name: propertyNames[i] });
  }
  console.log("Created", properties.length, "properties");

  // ---- units (8 per property) ----
  const unitTypes = ["studio", "one_br", "two_br", "three_br", "penthouse", "commercial", "parking"];
  const units = [];
  for (const prop of properties) {
    for (let u = 1; u <= 8; u++) {
      const unit = await prisma.unit.create({
        data: {
          propertyId: prop.id,
          buildingId: prop.buildingId,
          floorId: prop.floorId,
          unitNumber: prop.propertyCode + "-" + u,
          unitType: unitTypes[(u - 1) % unitTypes.length],
          squareMeters: 25 + u * 5,
          bedrooms: u % 3,
          bathrooms: 1 + (u % 2),
          hasBalcony: u % 2 === 0,
          hasParking: u % 3 === 0,
        },
      });
      units.push({ ...unit, propertyId: prop.id });
    }
  }
  console.log("Created", units.length, "units");

  // ---- residents + leases (first 6 properties fully leased) ----
  const leaseTypes = ["standard_rental", "rent_to_own", "corporate_lease", "short_term"];
  const leases = [];
  const leasedUnitIdx = new Set();
  let residentNo = 1;
  for (let p = 0; p < 6; p++) {
    const propUnits = units.filter((u) => u.propertyId === properties[p].id);
    for (const unit of propUnits) {
      const email = "resident" + residentNo + "@demo.local";
      const user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          phone: "+63" + (9000000000 + residentNo),
          passwordHash: residentHash,
          userType: "tenant",
          firstName: "Resident",
          lastName: String(residentNo),
        },
      });
      const start = monthsAgo(6 + (residentNo % 6));
      const end = addMonths(start, 12);
      const rent = 8000 + ((residentNo * 1373) % 37000);
      const lease = await prisma.leaseAgreement.create({
        data: {
          propertyId: properties[p].id,
          tenantUserId: user.id,
          leaseType: leaseTypes[residentNo % leaseTypes.length],
          startDate: start,
          endDate: end,
          monthlyRentAmount: rent,
          securityDepositAmount: rent,
          isActive: true,
        },
      });
      leases.push({ ...lease, rent, user: user.id });
      leasedUnitIdx.add(unit.id);
      residentNo++;
    }
  }
  console.log("Created", leases.length, "active leases");

  // ---- rental payments (6 months history) ----
  let paidCount = 0;
  for (const lease of leases) {
    for (let m = 0; m < 6; m++) {
      const periodStart = monthsAgo(6 - m);
      const periodEnd = addMonths(periodStart, 1);
      const due = addMonths(periodStart, 1);
      let status, amountPaid = 0, paymentDate = null, paymentMethod = null;
      if (m < 4) {
        status = "paid";
        amountPaid = lease.rent;
        paymentDate = addMonths(periodStart, 1);
        paymentMethod = "gcash";
        paidCount++;
      } else if (m === 4) {
        status = "partially_paid";
        amountPaid = Math.round(lease.rent * 0.5);
        paymentDate = due;
        paymentMethod = "bank_transfer";
      } else {
        status = "overdue";
      }
      await prisma.rentalPayment.create({
        data: {
          leaseAgreementId: lease.id,
          billingPeriodStart: periodStart,
          billingPeriodEnd: periodEnd,
          dueDate: due,
          amountDue: lease.rent,
          amountPaid,
          paymentDate,
          paymentMethod,
          status,
        },
      });
    }
  }
  console.log("Created rental payments; paid instances:", paidCount);

  // ---- RTO contracts (subset of leases) ----
  let rtoEquity = 0;
  for (let i = 0; i < 5; i++) {
    const lease = leases[i * 3];
    const equity = (i + 1) * 25000;
    rtoEquity += equity;
    await prisma.rtoContract.create({
      data: {
        leaseAgreementId: lease.id,
        totalContractValue: lease.rent * 120,
        optionFeeAmount: lease.rent,
        monthlyRentPortion: lease.rent,
        monthlyEquityPortion: 5000,
        accumulatedEquity: equity,
        status: "active",
      },
    });
  }
  console.log("Created RTO contracts; total equity:", rtoEquity);

  // ---- service requests ----
  const categories = ["plumbing", "electrical", "hvac", "general", "pest", "elevator", "other"];
  const priorities = ["low", "medium", "high", "emergency"];
  for (let i = 0; i < 14; i++) {
    await prisma.serviceRequest.create({
      data: {
        tenantId: tenant.id,
        propertyId: properties[i % properties.length].id,
        category: categories[i % categories.length],
        priority: priorities[i % priorities.length],
        description: "Demo service request #" + (i + 1),
        status: i % 3 === 0 ? "open" : i % 3 === 1 ? "assigned" : "in_progress",
      },
    });
  }
  console.log("Created 14 service requests");

  // ---- agents + transactions ----
  const tiers = ["junior", "senior", "team_lead", "external_broker"];
  for (let i = 0; i < 4; i++) {
    const email = "agent" + (i + 1) + "@demo.local";
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        phone: "+63" + (9111111111 + i),
        passwordHash: agentHash,
        userType: "agent",
        firstName: "Agent",
        lastName: String(i + 1),
      },
    });
    const agent = await prisma.realEstateAgent.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        licenseNumber: "LIC-" + (1000 + i),
        commissionRateDefault: 3 + i,
        tier: tiers[i % tiers.length],
        isInternal: i < 3,
      },
    });
    const prop = properties[i % properties.length];
    await prisma.agentTransaction.create({
      data: {
        agentId: agent.id,
        transactionType: i % 2 === 0 ? "rental_lease" : "sale",
        propertyId: prop.id,
        transactionAmount: 20000 + i * 5000,
        calculatedCommission: 1500 + i * 300,
        finalCommission: 1500 + i * 300,
        status: i % 2 === 0 ? "fully_paid" : "pending",
        transactionDate: monthsAgo(i + 1),
      },
    });
  }
  console.log("Created 4 agents with transactions");

  // ---- notifications (admin) ----
  const notifTypes = ["rent_due", "rent_overdue", "service_request", "announcement", "system"];
  for (let i = 0; i < 6; i++) {
    await prisma.notification.create({
      data: {
        role: "admin",
        tenantId: tenant.id,
        type: notifTypes[i % notifTypes.length],
        title: "Demo notification " + (i + 1),
        message: "This is a seeded demo notification #" + (i + 1),
        isRead: i % 2 === 0,
      },
    });
  }
  console.log("Created notifications");

  // ---- summary ----
  const kpis = await prisma.property.count({ where: { tenantId: tenant.id } });
  const uCount = await prisma.unit.count({ where: { property: { tenantId: tenant.id } } });
  const lCount = await prisma.leaseAgreement.count({ where: { property: { tenantId: tenant.id }, isActive: true } });
  console.log("DONE. Properties:", kpis, "Units:", uCount, "Active leases:", lCount);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
