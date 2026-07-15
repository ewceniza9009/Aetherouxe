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
  CondoUnit = "condo_unit",
  HouseAndLot = "house_and_lot",
  Townhouse = "townhouse",
  CommercialSpace = "commercial_space",
  ParkingSlot = "parking_slot",
}

export enum PropertyStatus {
  Available = "available",
  Reserved = "reserved",
  Sold = "sold",
  Rented = "rented",
  RtoActive = "rto_active",
  UnderMaintenance = "under_maintenance",
}

export enum LeaseType {
  StandardRental = "standard_rental",
  RentToOwn = "rent_to_own",
  CorporateLease = "corporate_lease",
  ShortTerm = "short_term",
}

export enum RTOStatus {
  Active = "active",
  GracePeriod = "grace_period",
  Defaulted = "defaulted",
  Exercised = "exercised",
  Completed = "completed",
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
