import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany();
  let totalAssigned = 0;

  for (const tenant of tenants) {
    const email = `portfolio@${tenant.domain}`;
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          tenantId: tenant.id,
          email,
          phone: null,
          passwordHash: 'NOLOGIN',
          userType: 'owner',
          firstName: 'Portfolio',
          lastName: tenant.name,
          isActive: true,
          tokenVersion: 0,
        },
      });
    }
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { companyOwnerId: user.id },
    });

    const { count } = await prisma.property.updateMany({
      where: { tenantId: tenant.id, ownerId: null },
      data: { ownerId: user.id },
    });
    totalAssigned += count;
    console.log(`Tenant ${tenant.domain}: company owner ${user.id}, assigned ${count} properties`);
  }

  console.log(`Backfill complete. Total properties assigned: ${totalAssigned}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
