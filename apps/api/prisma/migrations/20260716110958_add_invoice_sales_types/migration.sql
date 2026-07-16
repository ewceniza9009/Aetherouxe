-- AlterEnum
BEGIN;
ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'downpayment';
ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'reservation';
ALTER TYPE "InvoiceType" ADD VALUE IF NOT EXISTS 'equity_credit';
COMMIT;
