import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.projectImage.deleteMany();
  await prisma.propertyImage.deleteMany();

  const projects = await prisma.project.findMany();
  for (let idx = 0; idx < projects.length; idx++) {
    const project = projects[idx];
    for (let i = 0; i < 3; i++) {
      await prisma.projectImage.create({
        data: {
          projectId: project.id,
          url: `https://picsum.photos/seed/project-${project.id}-${i}/1200/800`,
          sortOrder: i,
          isPrimary: i === 0,
          alt: project.name + ' image ' + (i + 1),
        },
      });
    }
    console.log('Added variety images to project:', project.name);
  }

  const properties = await prisma.property.findMany();
  for (let idx = 0; idx < properties.length; idx++) {
    const property = properties[idx];
    for (let i = 0; i < 3; i++) {
      await prisma.propertyImage.create({
        data: {
          propertyId: property.id,
          url: `https://picsum.photos/seed/property-${property.id}-${i}/1200/800`,
          sortOrder: i,
          isPrimary: i === 0,
          alt: property.propertyCode + ' image ' + (i + 1),
        },
      });
    }
    console.log('Added variety images to property:', property.propertyCode);
  }
}

main()
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
