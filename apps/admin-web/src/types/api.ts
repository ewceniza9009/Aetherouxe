/**
 * Raw API response shapes used in mapper functions.
 * These mirror the underlying Prisma response structures but are
 * intentionally loose to allow optional fields.
 */

export interface RawAgentUser {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface RawAgent {
  id: string;
  userId?: string | null;
  tenantId?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  licenseNumber?: string | null;
  tier?: string;
  commissionRateDefault?: number | null;
  isInternal?: boolean;
  managerId?: string | null;
  manager?: { user?: RawAgentUser } | null;
  licenseStatus?: string | null;
  status?: string | null;
  transactionCount?: number;
  totalSalesVolume?: number | null;
  commissionEarned?: number | null;
  commissionPaid?: number | null;
  propertiesSold?: number | null;
  propertiesLeased?: number | null;
  createdAt: string;
  updatedAt: string;
  user?: RawAgentUser;
}

export interface RawBudgetItem {
  id: string;
  budgetId?: string;
  category?: string;
  subcategory?: string;
  description?: string | null;
  plannedAmount?: number | null;
  actualAmount?: number | null;
  vendor?: string | null;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawBudget {
  id: string;
  projectId: string;
  budgetName?: string;
  name?: string;
  versionNumber?: number;
  version?: number;
  totalBudgetAmount?: number;
  totalPlanned?: number;
  totalActual?: number;
  actualSpent?: number;
  status?: string;
  currency?: string;
  lineItems?: RawBudgetItem[];
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawBuilding {
  id: string;
  propertyId?: string | null;
  projectId?: string | null;
  project?: { name?: string } | null;
  projectName?: string;
  name: string;
  buildingType?: string;
  type?: string;
  description?: string | null;
  address?: string;
  numberOfFloors?: number;
  floorCount?: number;
  yearBuilt?: number | null;
  totalUnits?: number;
  unitCount?: number;
  status?: string;
  _count?: { units?: number };
  units?: Array<unknown> | { length?: number };
  createdAt: string;
  updatedAt: string;
}

export interface RawFloor {
  id: string;
  buildingId: string;
  level: number;
  name: string;
  totalUnits?: number;
  createdAt: string;
  units?: RawUnit[];
}

export interface RawUnit {
  id: string;
  unitNumber: string;
  floorId?: string | null;
  propertyId?: string | null;
  property?: { name?: string; propertyCode?: string } | null;
  buildingId?: string | null;
  building?: { name?: string } | null;
  type?: string;
  unitType?: string;
  status?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareMeters?: number | null;
  size?: number | string | null;
  features?: string | string[] | null;
  listPrice?: number | string | null;
  lotValue?: number | string | null;
  buildingValue?: number | string | null;
  rentAmount?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawLease {
  id: string;
  landlordId: string;
  tenantId: string;
  unitId?: string;
  unitLabel?: string;
  schemeType?: string | null;
  leaseType?: string;
  status?: string;
  startDate: string;
  endDate: string;
  monthlyRentAmount?: number | string | null;
  securityDepositAmount?: number | string | null;
  latePaymentPenaltyPercent?: number | string | null;
  gracePeriodDays?: number | null;
  isActive?: boolean;
  terms?: string | null;
  tenantUserId?: string | null;
  propertyId?: string;
  property?: { id?: string; name?: string; propertyCode?: string; propertyType?: string } | null;
  unit?: { unitNumber?: string } | null;
  createdAt: string;
  updatedAt: string;
  mortgageScenarios?: RawMortgage[];
  rtoContract?: RawRTO | null;
}

export interface RawMortgage {
  id: string;
  leaseId?: string | null;
  loanAmount?: number | string | null;
  principal: number;
  downPayment: number;
  interestRate: number;
  interestRatePercent?: number;
  termMonths: number;
  loanTermMonths?: number;
  monthlyPayment: number;
  monthlyAmortization?: number | string | null;
  status?: string;
  createdAt: string;
  amortizationSchedule?: Array<{ month: number; principal: number; interest: number; balance: number }>;
}

export interface RawRTO {
  id: string;
  leaseId: string;
  startingEquity: number;
  equityPerPayment: number;
  totalContractPrice: number;
  status?: string;
  createdAt: string;
}

export interface RawProperty {
  id: string;
  propertyCode?: string;
  code?: string;
  name?: string;
  propertyType?: string;
  type?: string;
  status?: string;
  projectId?: string;
  project?: { id?: string; name?: string } | null;
  buildingId?: string | null;
  floorId?: string | null;
  unitId?: string | null;
  description?: string | null;
  address?: string;
  yearBuilt?: number | null;
  lotSize?: string | null;
  totalSquareFeet?: string | null;
  monthlyRevenue?: number | null;
  occupancyRate?: number | null;
  images?: RawPropertyImage[];
  units?: Array<{ buildingId?: string; floorId?: string | null; [key: string]: unknown }>;
  buildings?: Array<{ id?: string; name?: string; address?: string }>;
  building?: { id?: string; name?: string; address?: string } | null;
  _count?: { units?: number };
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawPropertyImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
  propertyId?: string;
  createdAt?: string;
}

export interface RawBudget {
  id: string;
  projectId: string;
  budgetName?: string;
  name?: string;
  description?: string | null;
  versionNumber?: number;
  version?: number;
  totalBudgetAmount?: number;
  totalPlanned?: number;
  totalActual?: number;
  actualSpent?: number;
  status?: string;
  plannedAmount?: number | null;
  actualAmount?: number | null;
  currency?: string;
  lineItems?: RawBudgetItem[];
  startDate?: string | null;
  endDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawPhase {
  id: string;
  projectId: string;
  name: string;
  status?: string;
  order?: number;
  startDate?: string | null;
  endDate?: string | null;
  completedAt?: string | null;
  createdAt: string;
}

export interface RawProject {
  id: string;
  name: string;
  projectType?: string;
  status?: string;
  address?: string;
  projectLogoUrl?: string | null;
  completionPercentage?: number;
  totalBudget?: number | null;
  totalSpent?: number | null;
  projectedROI?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RawCommunityPost {
  id: string;
  authorId: string;
  title: string;
  body: string;
  category?: string;
  status?: string;
  isPinned?: boolean;
  imageUrl?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RawPostComment {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
}

export interface RawCollectionActivity {
  id: string;
  caseId: string;
  userId?: string | null;
  activityType: string;
  description: string;
  createdAt: string;
}

export interface RawUtilityRate {
  utilityType: string;
  ratePerUnit?: number | null;
}
