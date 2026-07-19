import { z } from 'zod';

export const GlEntryLineSchema = z.object({
  accountId: z.string().uuid(),
  accountCode: z.string().min(1),
  accountName: z.string().min(1),
  debit: z.number().min(0),
  credit: z.number().min(0),
  description: z.string().optional(),
}).refine(data => {
  return !(data.debit > 0 && data.credit > 0);
}, { message: "A line cannot have both debit and credit" });

export const GlEntrySchema = z.object({
  entryNumber: z.string().optional(),
  date: z.string().datetime({ offset: true }),
  description: z.string().min(1),
  lines: z.array(GlEntryLineSchema).min(2, "Journal entry must have at least 2 lines")
    .refine(lines => {
      const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0);
      const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0);
      return Math.abs(totalDebit - totalCredit) < 0.01;
    }, { message: "Total debits must equal total credits" }),
});

export const RecordPaymentSchema = z.object({
  amountPaid: z.number().positive(),
  paymentDate: z.string().datetime({ offset: true }),
  paymentMethod: z.string().min(1),
  paymentReference: z.string().optional(),
});

export const CreateRentalPaymentSchema = z.object({
  leaseAgreementId: z.string().uuid(),
  billingPeriodStart: z.string().datetime({ offset: true }),
  billingPeriodEnd: z.string().datetime({ offset: true }),
  dueDate: z.string().datetime({ offset: true }),
  amountDue: z.number().positive(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
});
