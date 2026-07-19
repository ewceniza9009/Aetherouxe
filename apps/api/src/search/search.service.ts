import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface SearchResult {
  id: string;
  type: 'Tenant' | 'Property' | 'Unit' | 'Project';
  title: string;
  subtitle: string;
  url: string;
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(tenantId: string, query: string): Promise<SearchResult[]> {
    if (!query || query.length < 2) return [];

    const q = `%${query}%`;

    // We use Prisma's ILIKE-equivalent via contains and mode: 'insensitive'
    // Since we need to query multiple tables, we'll do them concurrently
    const [tenants, properties, units] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          tenantId,
          userType: 'tenant',
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.property.findMany({
        where: {
          tenantId,
          OR: [
            { propertyCode: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: 5,
      }),
      this.prisma.unit.findMany({
        where: {
          OR: [
            { unitNumber: { contains: query, mode: 'insensitive' } },
          ],
          property: {
            tenantId,
          }
        },
        include: { property: true },
        take: 5,
      }),
    ]);

    const results: SearchResult[] = [];

    for (const t of tenants) {
      results.push({
        id: t.id,
        type: 'Tenant',
        title: [t.firstName, t.lastName].filter(Boolean).join(' ') || t.email,
        subtitle: t.email,
        url: `/tenants/${t.id}`,
      });
    }

    for (const p of properties) {
      results.push({
        id: p.id,
        type: 'Property',
        title: p.propertyCode,
        subtitle: p.propertyType,
        url: `/properties/${p.id}`,
      });
    }

    for (const u of units) {
      results.push({
        id: u.id,
        type: 'Unit',
        title: `Unit ${u.unitNumber}`,
        subtitle: u.property?.propertyCode || 'No Property',
        url: `/properties/${u.propertyId}/units/${u.id}/edit`,
      });
    }

    return results;
  }
}
