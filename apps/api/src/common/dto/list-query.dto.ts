import { IsOptional, IsString, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Shared query contract for every list endpoint. New features should extend
 * this so pagination / search / sorting are uniform across the API instead
 * of each module reinventing `page`, `limit`, `search`, `sortBy`, `sortDir`.
 */
export class ListQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ type: Number, description: 'Absent or 0 returns all rows (no pagination).' })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: 'asc' | 'desc' = 'desc';

  // Legacy frontend aliases for `sortBy` / `sortDir`. Kept so existing
  // hooks that send `sort` / `order` keep working without changes.
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}

export interface PaginateArgs {
  page?: number;
  limit?: number;
  where?: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  defaultSort?: Record<string, any>;
  /** Whitelist of sortable fields. If sortBy is not in this list it is ignored
   *  (falls back to defaultSort). Prevents unindexed/invalid sort injection. */
  allowedSortFields?: string[];
}

export interface PaginatedResult<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/**
 * Consistent paginated list helper. Returns the same `{ data, meta }` shape
 * every list endpoint already uses, so the response contract never drifts.
 */
export async function paginate<T>(
  delegate: {
    findMany: (args: any) => Promise<T[]>;
    count: (args: any) => Promise<number>;
  },
  args: PaginateArgs,
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, Math.floor(Number(args.page) || 1) || 1);
  // limit === 0 (or absent) means "return everything" — used by list screens
  // and dashboards that need the full set rather than a paged slice. This
  // avoids silently clipping previously-unbounded endpoints when they were
  // migrated to the shared paginate() helper.
  const rawLimit = Math.floor(Number(args.limit));
  const limited = rawLimit > 0;
  const limit = limited ? Math.min(100, rawLimit) : 0;
  const skip = limited ? (page - 1) * limit : 0;

  const sortBy =
    args.sortBy && args.allowedSortFields?.includes(args.sortBy)
      ? args.sortBy
      : undefined;
  const orderBy = sortBy
    ? { [sortBy]: args.sortDir ?? 'desc' }
    : args.defaultSort ?? { createdAt: 'desc' };

  const [data, total] = await Promise.all([
    delegate.findMany({
      where: args.where,
      include: args.include,
      select: args.select,
      orderBy,
      ...(limited ? { skip, take: limit } : {}),
    }),
    delegate.count({ where: args.where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit: limited ? limit : total,
      total,
      // When unpaged, everything is one page.
      totalPages: limited ? (total === 0 ? 1 : Math.ceil(total / limit)) : 1,
    },
  };
}
