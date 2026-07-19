import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface NextCodeOptions {
  /** Static prefix, e.g. "INV". If omitted, the stored counter prefix is used. */
  prefix?: string;
  /** Zero-pad the numeric portion to this width (default 6). */
  pad?: number;
  /** Suffix appended after the number, e.g. the year. */
  suffix?: string;
  /** Separator between prefix and number (default "-"). */
  separator?: string;
  /** Starting value if the counter does not yet exist (default 1). */
  startAt?: number;
}

/**
 * Centralized, database-backed sequential code generation.
 *
 * Every business code (AR/AP invoices, leases, reservations, statements, …)
 * is produced here so numbering is:
 *   - incremental and gap-light (atomic increment),
 *   - collision-free across concurrent transactions,
 *   - consistent in format (prefix + zero-padded sequence + optional suffix).
 *
 * The counter is incremented atomically via Prisma's `increment` update inside
 * a transaction, so two concurrent callers can never receive the same value.
 */
@Injectable()
export class CodeSequenceService {
  private readonly logger = new Logger(CodeSequenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the next sequential code for the given key.
   * The numeric portion is allocated atomically; the formatted string is
   * derived afterwards so the format can change without renumbering.
   */
  async next(key: string, opts: NextCodeOptions = {}): Promise<string> {
    const pad = opts.pad ?? 6;
    const separator = opts.separator ?? '-';
    const suffix = opts.suffix ? `${separator}${opts.suffix}` : '';

    // Atomic increment inside a transaction guarantees a unique value.
    const counter = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.sequenceCounter.findUnique({ where: { key } });
      if (!existing) {
        return tx.sequenceCounter.create({
          data: {
            key,
            value: (opts.startAt ?? 1) - 1,
            prefix: opts.prefix ?? null,
          },
        });
      }
      return tx.sequenceCounter.update({
        where: { key },
        data: { value: { increment: 1 } },
      });
    });

    const prefix = opts.prefix ?? counter.prefix ?? key.toUpperCase().slice(0, 4);
    const nextValue = counter.value + 1;
    return `${prefix}${separator}${String(nextValue).padStart(pad, '0')}${suffix}`.replace(
      `${separator}${separator}`,
      separator,
    );
  }

  /**
   * Non-transactional peek at the current (last issued) value for a key.
   */
  async current(key: string): Promise<number> {
    const c = await this.prisma.sequenceCounter.findUnique({ where: { key } });
    return c?.value ?? 0;
  }
}
