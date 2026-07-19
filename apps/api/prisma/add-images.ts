import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const UNSPLASH_PROJECT = [
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1479839672679-a46483c0e7c8?q=80&w=2000&auto=format&fit=crop',
];

const UNSPLASH_PROPERTY = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=2000&auto=format&fit=crop',
];

async function main() {
  const projects = await prisma.project.findMany();
  for (const project of projects) {
    const existing = await prisma.projectImage.count({ where: { projectId: project.id } });
    if (existing === 0) {
      for (let i = 0; i < 3; i++) {
        await prisma.projectImage.create({
          data: {
            projectId: project.id,
            url: UNSPLASH_PROJECT[i % UNSPLASH_PROJECT.length],
            sortOrder: i,
            isPrimary: i === 0,
            alt: project.name + ' image ' + (i + 1),
          },
        });
      }
      console.log('Added images to project:', project.name);
    }
  }

  const properties = await prisma.property.findMany();
  for (let idx = 0; idx < properties.length; idx++) {
    const property = properties[idx];
    const existing = await prisma.propertyImage.count({ where: { propertyId: property.id } });
    if (existing === 0) {
      for (let i = 0; i < 3; i++) {
        await prisma.propertyImage.create({
          data: {
            propertyId: property.id,
            url: UNSPLASH_PROPERTY[(idx + i) % UNSPLASH_PROPERTY.length],
            sortOrder: i,
            isPrimary: i === 0,
            alt: property.propertyCode + ' image ' + (i + 1),
          },
        });
      }
      console.log('Added images to property:', property.propertyCode);
    }
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
