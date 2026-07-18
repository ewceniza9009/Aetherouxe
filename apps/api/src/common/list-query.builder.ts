import { ListQueryDto } from './dto/list-query.dto';

/**
 * Declarative description of what a list endpoint allows the client to
 * filter / search / sort on. This is the security + performance boundary:
 * only fields listed here can ever reach the database query, and sortable
 * fields should correspond to indexed columns to avoid full table scans.
 */
export interface FieldMap {
  /** Exact-match filters exposed to the client. */
  filters?: {
    field: string;
    type?: 'eq' | 'enum' | 'bool' | 'relation';
    /** For filtering on a related row's column, e.g. leaseAgreement.propertyId.
     *  Emits a nested `where: { [relation]: { [fk]: value } }`. */
    relation?: string;
    fk?: string;
  }[];
  /** Fields searched via case-insensitive `contains` (supports relation
   *  paths, e.g. `user.firstName`). */
  search?: string[];
  /** Whitelisted sort fields. Must map to indexed columns. */
  sortable?: string[];
  /** Maps client-sent sort keys (e.g. table column ids) to real DB columns,
   *  e.g. `{ code: 'propertyCode', type: 'propertyType' }`. The resolved
   *  target must still be present in `sortable`. */
  sortAliases?: Record<string, string>;
}

export interface BuiltQuery {
  where: Record<string, any>;
  orderBy: Record<string, any>;
  skip: number;
  take: number;
}

const MAX_LIMIT = 100;

/**
 * Turns a ListQueryDto + a per-entity FieldMap into a safe Prisma
 * `where` / `orderBy` / `skip` / `take`. Callers hand the result to
 * `paginate()`. The FieldMap is the only thing that reaches the DB, so
 * clients cannot filter or sort on unauthorized/unindexed fields.
 */
export function buildListQuery(
  query: ListQueryDto,
  map: FieldMap,
  defaultSort: Record<string, any> = { createdAt: 'desc' },
): BuiltQuery {
  const where: Record<string, any> = {};

  // Exact-match filters (eq / enum / bool / relation)
  for (const f of map.filters ?? []) {
    const raw = (query as any)[f.field];
    if (raw === undefined || raw === null || raw === '') continue;
    if (f.type === 'bool') {
      if (raw === 'true' || raw === true) where[f.field] = true;
      else if (raw === 'false' || raw === false) where[f.field] = false;
    } else if (f.relation && f.fk) {
      where[f.relation] = { [f.fk]: raw };
    } else {
      where[f.field] = raw;
    }
  }

  // Free-text search across declared fields (case-insensitive contains).
  // Fields may be relation paths (e.g. `property.propertyCode`), which Prisma
  // requires as nested objects rather than dotted keys.
  if (query.search && map.search && map.search.length > 0) {
    const term = String(query.search).trim();
    if (term) {
      where.OR = map.search.map((field) => {
        if (field.includes('.')) {
          const [relation, ...rest] = field.split('.');
          const nested: Record<string, any> = {};
          let cursor = nested;
          rest.forEach((key, i) => {
            if (i === rest.length - 1) {
              cursor[key] = { contains: term, mode: 'insensitive' };
            } else {
              cursor[key] = {};
              cursor = cursor[key];
            }
          });
          return { [relation]: nested };
        }
        return { [field]: { contains: term, mode: 'insensitive' } };
      });
    }
  }

  // Sorting — only if the requested field is whitelisted.
  // Accept both the canonical `sortBy`/`sortDir` and the legacy
  // frontend aliases `sort`/`order` so existing hooks need no change.
  const requestedSort = (query.sortBy ?? (query as any).sort) as string | undefined;
  const requestedDir = (query.sortDir ?? (query as any).order) as 'asc' | 'desc' | undefined;
  // Resolve a client column id (e.g. "code") to the real DB column if an
  // alias is declared, then validate against the whitelist.
  const resolvedSort = requestedSort
    ? (map.sortAliases?.[requestedSort] ?? requestedSort)
    : undefined;
  const sortBy =
    resolvedSort && map.sortable?.includes(resolvedSort)
      ? resolvedSort
      : undefined;
  const orderBy = sortBy
    ? { [sortBy]: requestedDir ?? 'desc' }
    : defaultSort;

  const page = Math.max(1, Math.floor(Number(query.page) || 1));
  const limit = Math.max(1, Math.min(MAX_LIMIT, Math.floor(Number(query.limit) || 10)));

  return {
    where,
    orderBy,
    skip: (page - 1) * limit,
    take: limit,
  };
}
