-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('super_admin', 'admin', 'property_manager', 'finance', 'agent', 'owner', 'tenant');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('condo_unit', 'house_and_lot', 'townhouse', 'commercial_space', 'parking_slot');

-- CreateEnum
CREATE TYPE "PropertyStatus" AS ENUM ('available', 'reserved', 'sold', 'rented', 'rto_active', 'under_maintenance');

-- CreateEnum
CREATE TYPE "BuildingType" AS ENUM ('tower', 'mid_rise', 'low_rise', 'cluster', 'block');

-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('studio', 'one_br', 'two_br', 'three_br', 'penthouse', 'commercial', 'parking');

-- CreateEnum
CREATE TYPE "ProjectType" AS ENUM ('high_rise', 'mid_rise', 'village', 'township', 'commercial_complex');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('planning', 'pre_selling', 'construction', 'fit_out', 'completed', 'turnover');

-- CreateEnum
CREATE TYPE "PhaseStatus" AS ENUM ('planning', 'in_progress', 'completed', 'delayed', 'on_hold');

-- CreateEnum
CREATE TYPE "BudgetCategory" AS ENUM ('land_acquisition', 'construction', 'permits', 'architectural_design', 'engineering', 'interior_fit_out', 'landscaping', 'marketing', 'contingency', 'misc');

-- CreateEnum
CREATE TYPE "ContractorEngagementStatus" AS ENUM ('pending', 'active', 'completed', 'disputed');

-- CreateEnum
CREATE TYPE "LeaseType" AS ENUM ('standard_rental', 'rent_to_own', 'corporate_lease', 'short_term');

-- CreateEnum
CREATE TYPE "RTOStatus" AS ENUM ('active', 'grace_period', 'defaulted', 'exercised', 'completed');

-- CreateEnum
CREATE TYPE "AgentTier" AS ENUM ('junior', 'senior', 'team_lead', 'external_broker');

-- CreateEnum
CREATE TYPE "CommissionType" AS ENUM ('flat_amount', 'percentage_of_sale', 'percentage_of_rent', 'tiered');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('sale', 'rental_lease', 'rto_contract', 'lease_renewal');

-- CreateEnum
CREATE TYPE "CommissionStatus" AS ENUM ('pending', 'approved', 'partially_paid', 'fully_paid', 'disputed');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'pending_approval', 'approved', 'paid', 'partially_paid', 'overdue', 'waived');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('rental', 'utility_water', 'utility_electricity', 'association_dues', 'late_fee', 'damage_charge', 'misc');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'partially_paid', 'paid', 'overdue', 'disputed', 'written_off');

-- CreateEnum
CREATE TYPE "PaymentArrangementStatus" AS ENUM ('proposed', 'approved', 'active', 'completed', 'broken');

-- CreateEnum
CREATE TYPE "CollectionActionType" AS ENUM ('reminder_email', 'reminder_sms', 'phone_call', 'demand_letter', 'site_visit', 'legal_notice');

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('water', 'electricity');

-- CreateEnum
CREATE TYPE "UtilityType" AS ENUM ('water', 'electricity', 'gas');

-- CreateEnum
CREATE TYPE "BillStatus" AS ENUM ('pending', 'paid', 'partially_paid', 'waived', 'disputed');

-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('gym', 'pool', 'function_room', 'parking', 'garden', 'other');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('announcement', 'event');

-- CreateEnum
CREATE TYPE "Audience" AS ENUM ('all', 'building', 'property', 'unit');

-- CreateEnum
CREATE TYPE "ServiceCategory" AS ENUM ('plumbing', 'electrical', 'hvac', 'general', 'pest', 'elevator', 'other');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('low', 'medium', 'high', 'emergency');

-- CreateEnum
CREATE TYPE "ServiceStatus" AS ENUM ('open', 'assigned', 'in_progress', 'completed', 'cancelled', 'rejected');

-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

-- CreateEnum
CREATE TYPE "DocOwnerType" AS ENUM ('tenant', 'owner', 'property', 'lease', 'project', 'unit');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('lease_agreement', 'id_proof', 'title_deed', 'permit', 'insurance', 'statement', 'other');

-- CreateEnum
CREATE TYPE "SignatureStatus" AS ENUM ('pending', 'sent', 'signed', 'declined', 'expired');

-- CreateEnum
CREATE TYPE "PnlStatus" AS ENUM ('draft', 'issued');

-- CreateEnum
CREATE TYPE "ReminderType" AS ENUM ('pre_due', 'post_due', 'final_notice');

-- CreateEnum
CREATE TYPE "ReminderChannel" AS ENUM ('email', 'sms', 'portal', 'letter');

-- CreateEnum
CREATE TYPE "ReminderStatus" AS ENUM ('pending', 'sent', 'failed', 'acknowledged');

-- CreateEnum
CREATE TYPE "StatementStatus" AS ENUM ('draft', 'sent', 'disputed');

-- CreateEnum
CREATE TYPE "CollectionActivityType" AS ENUM ('call', 'email', 'letter', 'visit', 'payment_promise', 'legal_notice');

-- CreateEnum
CREATE TYPE "CollectionCaseStatus" AS ENUM ('open', 'in_progress', 'escalated', 'resolved', 'written_off');

-- CreateEnum
CREATE TYPE "CollectionCasePriority" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('rent_due', 'rent_overdue', 'service_request', 'document_signature', 'collection_case', 'announcement', 'system');

-- CreateEnum
CREATE TYPE "NotificationRole" AS ENUM ('admin', 'owner', 'resident');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "logoUrl" TEXT,
    "settings" JSONB DEFAULT '{}',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "userType" "UserType" NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "tokenVersion" INTEGER NOT NULL DEFAULT 0,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "real_estate_agents" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "tinNumber" TEXT,
    "commissionRateDefault" DECIMAL(5,2),
    "tier" "AgentTier" NOT NULL DEFAULT 'junior',
    "managerId" TEXT,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_estate_agents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "properties" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "propertyCode" TEXT NOT NULL,
    "propertyType" "PropertyType" NOT NULL,
    "status" "PropertyStatus" NOT NULL DEFAULT 'available',
    "specsDocumentId" TEXT,
    "parentPropertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "properties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buildings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "projectId" TEXT,
    "name" TEXT NOT NULL,
    "buildingType" "BuildingType" NOT NULL,
    "floorCount" INTEGER,
    "unitCount" INTEGER,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "buildings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "floors" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorNumber" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "floorPlanUrl" TEXT,

    CONSTRAINT "floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "units" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "unitNumber" TEXT NOT NULL,
    "unitType" "UnitType" NOT NULL,
    "squareMeters" DECIMAL(10,2),
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "hasBalcony" BOOLEAN NOT NULL DEFAULT false,
    "hasParking" BOOLEAN NOT NULL DEFAULT false,
    "facingDirection" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "units_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "projectType" "ProjectType" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'planning',
    "totalPhases" INTEGER,
    "targetStartDate" TIMESTAMP(3),
    "targetCompletionDate" TIMESTAMP(3),
    "actualCompletionDate" TIMESTAMP(3),
    "projectLogoUrl" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phases" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "phaseName" TEXT NOT NULL,
    "phaseOrder" INTEGER NOT NULL,
    "status" "PhaseStatus" NOT NULL DEFAULT 'planning',
    "targetStart" TIMESTAMP(3),
    "targetEnd" TIMESTAMP(3),
    "actualStart" TIMESTAMP(3),
    "actualEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budgets" (
    "id" TEXT NOT NULL,
    "phaseId" TEXT,
    "projectId" TEXT,
    "budgetName" TEXT NOT NULL,
    "totalBudgetAmount" DECIMAL(14,2) NOT NULL,
    "approvedByUserId" TEXT,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "budget_line_items" (
    "id" TEXT NOT NULL,
    "budgetId" TEXT NOT NULL,
    "category" "BudgetCategory" NOT NULL,
    "subcategory" TEXT,
    "plannedAmount" DECIMAL(14,2) NOT NULL,
    "actualAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "vendorName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "budget_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractors" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "licenseNumber" TEXT,
    "taxId" TEXT,
    "specialization" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contractors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_engagements" (
    "id" TEXT NOT NULL,
    "budgetLineItemId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "contractAmount" DECIMAL(14,2) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "contractDocumentUrl" TEXT,
    "terms" TEXT,
    "status" "ContractorEngagementStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contractor_engagements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contractor_payments" (
    "id" TEXT NOT NULL,
    "contractorEngagementId" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "invoiceReference" TEXT,
    "paymentMethod" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending_approval',
    "approvedByUserId" TEXT,
    "receiptUrl" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contractor_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lease_agreements" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantUserId" TEXT NOT NULL,
    "leaseType" "LeaseType" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "monthlyRentAmount" DECIMAL(12,2) NOT NULL,
    "securityDepositAmount" DECIMAL(12,2),
    "securityDepositHeldIn" TEXT,
    "latePaymentPenaltyPercent" DECIMAL(5,2),
    "gracePeriodDays" INTEGER DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "terminationDate" TIMESTAMP(3),
    "terminationReason" TEXT,
    "leaseDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lease_agreements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rental_payments" (
    "id" TEXT NOT NULL,
    "leaseAgreementId" TEXT NOT NULL,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amountDue" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) DEFAULT 0,
    "paymentDate" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "lateFeeApplied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rental_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_scenarios" (
    "id" TEXT NOT NULL,
    "leaseAgreementId" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "generatedForUserId" TEXT NOT NULL,
    "propertyValueAtGeneration" DECIMAL(14,2) NOT NULL,
    "downPaymentPercent" DECIMAL(5,2) NOT NULL,
    "loanAmount" DECIMAL(14,2) NOT NULL,
    "interestRatePercent" DECIMAL(5,3) NOT NULL,
    "loanTermMonths" INTEGER NOT NULL,
    "monthlyAmortization" DECIMAL(12,2) NOT NULL,
    "totalInterestPayable" DECIMAL(14,2) NOT NULL,
    "generationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mortgage_amortization_schedules" (
    "id" TEXT NOT NULL,
    "mortgageScenarioId" TEXT NOT NULL,
    "periodNumber" INTEGER NOT NULL,
    "beginningBalance" DECIMAL(14,2) NOT NULL,
    "monthlyPayment" DECIMAL(12,2) NOT NULL,
    "principalPayment" DECIMAL(12,2) NOT NULL,
    "interestPayment" DECIMAL(12,2) NOT NULL,
    "endingBalance" DECIMAL(14,2) NOT NULL,
    "cumulativeInterestPaid" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mortgage_amortization_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rto_contracts" (
    "id" TEXT NOT NULL,
    "leaseAgreementId" TEXT NOT NULL,
    "totalContractValue" DECIMAL(14,2) NOT NULL,
    "optionFeeAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "monthlyRentPortion" DECIMAL(12,2) NOT NULL,
    "monthlyEquityPortion" DECIMAL(12,2) NOT NULL,
    "accumulatedEquity" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "targetPurchaseDate" TIMESTAMP(3),
    "purchaseOptionPrice" DECIMAL(14,2),
    "isOptionExercised" BOOLEAN NOT NULL DEFAULT false,
    "exerciseDate" TIMESTAMP(3),
    "status" "RTOStatus" NOT NULL DEFAULT 'active',
    "contractDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rto_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rto_payment_allocations" (
    "id" TEXT NOT NULL,
    "rentalPaymentId" TEXT NOT NULL,
    "rtoContractId" TEXT NOT NULL,
    "rentPortionAmount" DECIMAL(12,2) NOT NULL,
    "equityPortionAmount" DECIMAL(12,2) NOT NULL,
    "totalPaymentAmount" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rto_payment_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rto_equity_ledger" (
    "id" TEXT NOT NULL,
    "rtoContractId" TEXT NOT NULL,
    "transactionType" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "runningBalance" DECIMAL(14,2) NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rto_equity_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commissions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "agentTier" "AgentTier",
    "propertyType" "PropertyType",
    "projectId" TEXT,
    "commissionType" "CommissionType" NOT NULL,
    "commissionValue" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_commissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_transactions" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "propertyId" TEXT NOT NULL,
    "leaseAgreementId" TEXT,
    "transactionAmount" DECIMAL(14,2) NOT NULL,
    "commissionRuleId" TEXT,
    "calculatedCommission" DECIMAL(12,2) NOT NULL,
    "finalCommission" DECIMAL(12,2),
    "status" "CommissionStatus" NOT NULL DEFAULT 'pending',
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_commission_releases" (
    "id" TEXT NOT NULL,
    "agentTransactionId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "releaseType" TEXT NOT NULL,
    "agingBucket" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_commission_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_license_renewals" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "licenseExpiryDate" TIMESTAMP(3) NOT NULL,
    "cpeUnitsCompleted" INTEGER DEFAULT 0,
    "cpeUnitsRequired" INTEGER DEFAULT 0,
    "renewalStatus" TEXT NOT NULL DEFAULT 'compliant',
    "renewalDocumentUrl" TEXT,
    "lastRenewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agent_license_renewals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_invoices" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceType" "InvoiceType" NOT NULL,
    "referenceSource" TEXT,
    "invoiceNumber" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "receivedByUserId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_payment_arrangements" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalOutstandingAmount" DECIMAL(14,2) NOT NULL,
    "numberOfInstallments" INTEGER NOT NULL,
    "installmentAmount" DECIMAL(12,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "PaymentArrangementStatus" NOT NULL DEFAULT 'proposed',
    "approvedByUserId" TEXT,
    "termsDocumentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_payment_arrangements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_arrangement_installments" (
    "id" TEXT NOT NULL,
    "paymentArrangementId" TEXT NOT NULL,
    "installmentNumber" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_arrangement_installments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ar_collection_actions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "actionType" "CollectionActionType" NOT NULL,
    "actionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "performedByUserId" TEXT,
    "outcome" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ar_collection_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_meters" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "unitId" TEXT,
    "propertyId" TEXT,
    "utilityType" "UtilityType" NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installationDate" TIMESTAMP(3),
    "lastReadingValue" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utility_meters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consumption_readings" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "readingDate" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "reader" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumption_readings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_bills" (
    "id" TEXT NOT NULL,
    "meterId" TEXT NOT NULL,
    "tenantId" TEXT,
    "unitId" TEXT,
    "propertyId" TEXT,
    "billingPeriodStart" TIMESTAMP(3) NOT NULL,
    "billingPeriodEnd" TIMESTAMP(3) NOT NULL,
    "previousReading" DOUBLE PRECISION NOT NULL,
    "currentReading" DOUBLE PRECISION NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "ratePerUnit" DOUBLE PRECISION NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "status" "BillStatus" NOT NULL DEFAULT 'pending',
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utility_bills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "utility_rates" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "meterType" "MeterType" NOT NULL,
    "ratePerUnit" DECIMAL(10,4) NOT NULL,
    "baseCharge" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL,
    "effectiveUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utility_rates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AmenityType" NOT NULL,
    "description" TEXT,
    "capacity" INTEGER,
    "location" TEXT,
    "hourlyRate" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "propertyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenity_bookings" (
    "id" TEXT NOT NULL,
    "amenityId" TEXT NOT NULL,
    "tenantId" TEXT,
    "unitId" TEXT,
    "bookingStart" TIMESTAMP(3) NOT NULL,
    "bookingEnd" TIMESTAMP(3) NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'pending',
    "totalAmount" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenity_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "unitId" TEXT,
    "propertyId" TEXT,
    "category" "ServiceCategory" NOT NULL,
    "priority" "Priority" NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ServiceStatus" NOT NULL DEFAULT 'open',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedToId" TEXT,
    "assignedToType" TEXT,
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maintenance_work_orders" (
    "id" TEXT NOT NULL,
    "serviceRequestId" TEXT NOT NULL,
    "vendorId" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "estimatedCost" DOUBLE PRECISION,
    "actualCost" DOUBLE PRECISION,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'scheduled',
    "completedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maintenance_work_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "community_posts" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "postType" "PostType" NOT NULL DEFAULT 'announcement',
    "audience" "Audience" NOT NULL DEFAULT 'all',
    "propertyId" TEXT,
    "scheduledAt" TIMESTAMP(3),
    "authorId" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_vaults" (
    "id" TEXT NOT NULL,
    "ownerType" "DocOwnerType" NOT NULL,
    "ownerId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "title" TEXT NOT NULL,
    "fileName" TEXT,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "fileSize" INTEGER,
    "uploadedById" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "isSigned" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_vaults_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_signatures" (
    "id" TEXT NOT NULL,
    "documentVaultId" TEXT NOT NULL,
    "signerName" TEXT NOT NULL,
    "signerEmail" TEXT,
    "signerUserId" TEXT,
    "status" "SignatureStatus" NOT NULL DEFAULT 'pending',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signatureUrl" TEXT,

    CONSTRAINT "document_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "owner_pnl_statements" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "grossRentalIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalExpenses" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "managementFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netIncome" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "yieldPct" DOUBLE PRECISION,
    "status" "PnlStatus" NOT NULL DEFAULT 'draft',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "owner_pnl_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_reminders" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ownerId" TEXT,
    "leaseId" TEXT,
    "rentalPaymentId" TEXT,
    "type" "ReminderType" NOT NULL,
    "channel" "ReminderChannel" NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "message" TEXT,
    "status" "ReminderStatus" NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statements_of_account" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "ownerId" TEXT,
    "propertyId" TEXT,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(14,2) NOT NULL,
    "totalBilled" DECIMAL(14,2) NOT NULL,
    "totalPaid" DECIMAL(14,2) NOT NULL,
    "closingBalance" DECIMAL(14,2) NOT NULL,
    "status" "StatementStatus" NOT NULL DEFAULT 'draft',
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "statements_of_account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_activities" (
    "id" TEXT NOT NULL,
    "collectionCaseId" TEXT NOT NULL,
    "activityType" "CollectionActivityType" NOT NULL,
    "performedById" TEXT,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "outcome" TEXT,
    "nextActionDate" TIMESTAMP(3),

    CONSTRAINT "collection_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_cases" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT,
    "leaseId" TEXT,
    "totalOutstanding" DECIMAL(14,2) NOT NULL,
    "priority" "CollectionCasePriority" NOT NULL DEFAULT 'medium',
    "status" "CollectionCaseStatus" NOT NULL DEFAULT 'open',
    "assignedToId" TEXT,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nextActionDate" TIMESTAMP(3),
    "resolutionNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collection_case_notes" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "authorId" TEXT,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collection_case_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "role" "NotificationRole" NOT NULL,
    "userId" TEXT,
    "tenantId" TEXT,
    "ownerId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "refId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ConsumptionReadingToUtilityBill" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_domain_key" ON "tenants"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_agents_userId_key" ON "real_estate_agents"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "real_estate_agents_licenseNumber_key" ON "real_estate_agents"("licenseNumber");

-- CreateIndex
CREATE UNIQUE INDEX "properties_propertyCode_key" ON "properties"("propertyCode");

-- CreateIndex
CREATE UNIQUE INDEX "rto_contracts_leaseAgreementId_key" ON "rto_contracts"("leaseAgreementId");

-- CreateIndex
CREATE UNIQUE INDEX "ar_invoices_invoiceNumber_key" ON "ar_invoices"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "utility_meters_meterNumber_key" ON "utility_meters"("meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "_ConsumptionReadingToUtilityBill_AB_unique" ON "_ConsumptionReadingToUtilityBill"("A", "B");

-- CreateIndex
CREATE INDEX "_ConsumptionReadingToUtilityBill_B_index" ON "_ConsumptionReadingToUtilityBill"("B");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_agents" ADD CONSTRAINT "real_estate_agents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_agents" ADD CONSTRAINT "real_estate_agents_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "real_estate_agents" ADD CONSTRAINT "real_estate_agents_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "real_estate_agents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_parentPropertyId_fkey" FOREIGN KEY ("parentPropertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "buildings" ADD CONSTRAINT "buildings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "floors" ADD CONSTRAINT "floors_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "buildings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "units" ADD CONSTRAINT "units_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "floors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phases" ADD CONSTRAINT "phases_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "phases"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "budget_line_items" ADD CONSTRAINT "budget_line_items_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractors" ADD CONSTRAINT "contractors_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_engagements" ADD CONSTRAINT "contractor_engagements_budgetLineItemId_fkey" FOREIGN KEY ("budgetLineItemId") REFERENCES "budget_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_engagements" ADD CONSTRAINT "contractor_engagements_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "contractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contractor_payments" ADD CONSTRAINT "contractor_payments_contractorEngagementId_fkey" FOREIGN KEY ("contractorEngagementId") REFERENCES "contractor_engagements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_tenantUserId_fkey" FOREIGN KEY ("tenantUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_leaseAgreementId_fkey" FOREIGN KEY ("leaseAgreementId") REFERENCES "lease_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_scenarios" ADD CONSTRAINT "mortgage_scenarios_leaseAgreementId_fkey" FOREIGN KEY ("leaseAgreementId") REFERENCES "lease_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_scenarios" ADD CONSTRAINT "mortgage_scenarios_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_scenarios" ADD CONSTRAINT "mortgage_scenarios_generatedForUserId_fkey" FOREIGN KEY ("generatedForUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mortgage_amortization_schedules" ADD CONSTRAINT "mortgage_amortization_schedules_mortgageScenarioId_fkey" FOREIGN KEY ("mortgageScenarioId") REFERENCES "mortgage_scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_contracts" ADD CONSTRAINT "rto_contracts_leaseAgreementId_fkey" FOREIGN KEY ("leaseAgreementId") REFERENCES "lease_agreements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_payment_allocations" ADD CONSTRAINT "rto_payment_allocations_rentalPaymentId_fkey" FOREIGN KEY ("rentalPaymentId") REFERENCES "rental_payments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_payment_allocations" ADD CONSTRAINT "rto_payment_allocations_rtoContractId_fkey" FOREIGN KEY ("rtoContractId") REFERENCES "rto_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_equity_ledger" ADD CONSTRAINT "rto_equity_ledger_rtoContractId_fkey" FOREIGN KEY ("rtoContractId") REFERENCES "rto_contracts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rto_equity_ledger" ADD CONSTRAINT "rto_equity_ledger_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commissions" ADD CONSTRAINT "agent_commissions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "real_estate_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_leaseAgreementId_fkey" FOREIGN KEY ("leaseAgreementId") REFERENCES "lease_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_transactions" ADD CONSTRAINT "agent_transactions_commissionRuleId_fkey" FOREIGN KEY ("commissionRuleId") REFERENCES "agent_commissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_commission_releases" ADD CONSTRAINT "agent_commission_releases_agentTransactionId_fkey" FOREIGN KEY ("agentTransactionId") REFERENCES "agent_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_license_renewals" ADD CONSTRAINT "agent_license_renewals_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agent_license_renewals" ADD CONSTRAINT "agent_license_renewals_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "real_estate_agents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_invoices" ADD CONSTRAINT "ar_invoices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_payments" ADD CONSTRAINT "ar_payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_arrangement_installments" ADD CONSTRAINT "ar_arrangement_installments_paymentArrangementId_fkey" FOREIGN KEY ("paymentArrangementId") REFERENCES "ar_payment_arrangements"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ar_collection_actions" ADD CONSTRAINT "ar_collection_actions_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "ar_invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_meters" ADD CONSTRAINT "utility_meters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_meters" ADD CONSTRAINT "utility_meters_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_meters" ADD CONSTRAINT "utility_meters_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consumption_readings" ADD CONSTRAINT "consumption_readings_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "utility_meters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_meterId_fkey" FOREIGN KEY ("meterId") REFERENCES "utility_meters"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_bills" ADD CONSTRAINT "utility_bills_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "utility_rates" ADD CONSTRAINT "utility_rates_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_amenityId_fkey" FOREIGN KEY ("amenityId") REFERENCES "amenities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenity_bookings" ADD CONSTRAINT "amenity_bookings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maintenance_work_orders" ADD CONSTRAINT "maintenance_work_orders_serviceRequestId_fkey" FOREIGN KEY ("serviceRequestId") REFERENCES "service_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_signatures" ADD CONSTRAINT "document_signatures_documentVaultId_fkey" FOREIGN KEY ("documentVaultId") REFERENCES "document_vaults"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_pnl_statements" ADD CONSTRAINT "owner_pnl_statements_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "owner_pnl_statements" ADD CONSTRAINT "owner_pnl_statements_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_reminders" ADD CONSTRAINT "payment_reminders_rentalPaymentId_fkey" FOREIGN KEY ("rentalPaymentId") REFERENCES "rental_payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_account" ADD CONSTRAINT "statements_of_account_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_account" ADD CONSTRAINT "statements_of_account_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statements_of_account" ADD CONSTRAINT "statements_of_account_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_activities" ADD CONSTRAINT "collection_activities_collectionCaseId_fkey" FOREIGN KEY ("collectionCaseId") REFERENCES "collection_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_activities" ADD CONSTRAINT "collection_activities_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_leaseId_fkey" FOREIGN KEY ("leaseId") REFERENCES "lease_agreements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_cases" ADD CONSTRAINT "collection_cases_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_case_notes" ADD CONSTRAINT "collection_case_notes_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "collection_cases"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collection_case_notes" ADD CONSTRAINT "collection_case_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsumptionReadingToUtilityBill" ADD CONSTRAINT "_ConsumptionReadingToUtilityBill_A_fkey" FOREIGN KEY ("A") REFERENCES "consumption_readings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ConsumptionReadingToUtilityBill" ADD CONSTRAINT "_ConsumptionReadingToUtilityBill_B_fkey" FOREIGN KEY ("B") REFERENCES "utility_bills"("id") ON DELETE CASCADE ON UPDATE CASCADE;
