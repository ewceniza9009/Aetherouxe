export enum UserType {
  SuperAdmin = "super_admin",
  Admin = "admin",
  PropertyManager = "property_manager",
  Finance = "finance",
  Agent = "agent",
  Owner = "owner",
  Tenant = "tenant",
}

export enum PropertyType {
  SingleFamily = "single_family",
  MultiFamily = "multi_family",
  Condo = "condo",
  Townhouse = "townhouse",
  Commercial = "commercial",
  Land = "land",
  Industrial = "industrial",
}

export enum PropertyStatus {
  Available = "available",
  Leased = "leased",
  UnderMaintenance = "under_maintenance",
  UnderConstruction = "under_construction",
  Sold = "sold",
  OffMarket = "off_market",
}

export enum LeaseType {
  Fixed = "fixed",
  MonthToMonth = "month_to_month",
  RentToOwn = "rent_to_own",
  Commercial = "commercial",
}

export enum RTOStatus {
  Active = "active",
  OnTrack = "on_track",
  Delinquent = "delinquent",
  Converted = "converted",
  Expired = "expired",
  Terminated = "terminated",
}

export enum InvoiceType {
  Rent = "rent",
  RTOOption = "rto_option",
  Maintenance = "maintenance",
  Utilities = "utilities",
  Parking = "parking",
  LateFee = "late_fee",
  Other = "other",
}

export enum InvoiceStatus {
  Draft = "draft",
  Sent = "sent",
  Paid = "paid",
  Overdue = "overdue",
  Partial = "partial",
  Cancelled = "cancelled",
}

export enum AgentTier {
  Junior = "junior",
  Senior = "senior",
  Lead = "lead",
  Director = "director",
}

export enum CommissionType {
  Percentage = "percentage",
  Flat = "flat",
  Tiered = "tiered",
  Referral = "referral",
}

export enum MeterType {
  Electric = "electric",
  Water = "water",
  Gas = "gas",
  Solar = "solar",
}

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
