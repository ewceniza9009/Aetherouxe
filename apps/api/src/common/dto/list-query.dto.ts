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
  page?: number = 1;

  @ApiPropertyOptional({ type: Number, default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10;

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
}

export interface PaginateArgs {
  page?: number;
  limit?: number;
  where?: Record<string, any>;
  include?: Record<string, any>;
  orderBy?: Record<string, any> | Record<string, any>[];
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  defaultSort?: Record<string, any>;
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
  const page = Math.max(1, Math.floor(Number(args.page) || 1));
  const limit = Math.max(1, Math.min(100, Math.floor(Number(args.limit) || 10)));
  const skip = (page - 1) * limit;

  const orderBy = args.sortBy
    ? { [args.sortBy]: args.sortDir ?? 'desc' }
    : args.defaultSort ?? { createdAt: 'desc' };

  const [data, total] = await Promise.all([
    delegate.findMany({
      where: args.where,
      include: args.include,
      orderBy,
      skip,
      take: limit,
    }),
    delegate.count({ where: args.where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
