import { UserType } from './enums';

export * from './enums';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    type: UserType;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  type: UserType;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: UserType;
  iat?: number;
  exp?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SchemeListItem {
  id: string;
  schemeType: import('./enums').SchemeType | null;
  unitLabel: string | null;
  unitId: string | null;
  propertyId: string;
  propertyName: string | null;
  leaseType: import('./enums').LeaseType | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  mortgageScenarioId: string | null;
  rtoContractId: string | null;
  tenantUserId: string | null;
  tenantName: string | null;
  monthlyRentAmount: number | null;
  agentId: string | null;
  agentName: string | null;
  schemeId: string | null;
  schemeCode: string | null;
  schemeName: string | null;
  agentCommissionPercentage: number | null;
  companyCommissionPercentage: number | null;
  assignedAgents: { agentId: string; commissionPercentage: number }[] | null;
  commissionRuleId: string | null;
}

export * from './schemas';
