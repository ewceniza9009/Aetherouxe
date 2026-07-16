import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function chance(p: number) {
  return Math.random() < p;
}
function money(min: number, max: number) {
  return Math.round((Math.random() * (max - min) + min) / 100) * 100;
}

const woStatusByRequest: Record<string, any> = {
  open: 'scheduled',
  assigned: 'scheduled',
  in_progress: 'in_progress',
  completed: 'completed',
  cancelled: 'cancelled',
};

async function main() {
  const requests = await prisma.serviceRequest.findMany();
  console.log(`Found ${requests.length} service requests`);

  const existing = await prisma.maintenanceWorkOrder.findMany();
  const covered = new Set(existing.map((w) => w.serviceRequestId));
  console.log(`Already have work orders for ${covered.size} requests`);

  let created = 0;
  for (const req of requests) {
    if (covered.has(req.id)) continue;
    if (!chance(0.8)) continue;

    const woStatus = woStatusByRequest[req.status] ?? 'scheduled';
    const est = money(1500, 85000);
    await prisma.maintenanceWorkOrder.create({
      data: {
        serviceRequestId: req.id,
        scheduledDate: chance(0.7) ? new Date(Date.now() + Math.floor(Math.random() * 21) * 86400000) : null,
        estimatedCost: est,
        actualCost: woStatus === 'completed' ? Math.round(est * (0.8 + Math.random() * 0.4)) : null,
        status: woStatus,
        completedDate: woStatus === 'completed' ? new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000) : null,
        notes: chance(0.5) ? 'Auto-generated work order from backfill script.' : null,
      },
    });
    created++;
  }
  console.log(`Created ${created} work orders`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
