// AUTO-GENERATED from apps/api/prisma/schema.prisma by scripts/generate-enums.mjs.
// Do not edit by hand. Run `node scripts/generate-enums.mjs` after changing enums.

export enum UserType {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  PropertyManager = 'property_manager',
  Finance = 'finance',
  Agent = 'agent',
  Owner = 'owner',
  Tenant = 'tenant',
}

export enum PropertyType {
  CondoUnit = 'condo_unit',
  HouseAndLot = 'house_and_lot',
  Townhouse = 'townhouse',
  CommercialSpace = 'commercial_space',
  ParkingSlot = 'parking_slot',
}

export enum PropertyStatus {
  Available = 'available',
  Reserved = 'reserved',
  Sold = 'sold',
  Rented = 'rented',
  RtoActive = 'rto_active',
  UnderMaintenance = 'under_maintenance',
}

export enum BuildingType {
  Tower = 'tower',
  MidRise = 'mid_rise',
  LowRise = 'low_rise',
  Cluster = 'cluster',
  Block = 'block',
}

export enum UnitType {
  Studio = 'studio',
  OneBr = 'one_br',
  TwoBr = 'two_br',
  ThreeBr = 'three_br',
  Penthouse = 'penthouse',
  Commercial = 'commercial',
  Parking = 'parking',
}

export enum UnitStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
  UnderMaintenance = 'under_maintenance',
  Rented = 'rented',
  RtoActive = 'rto_active',
  Sold = 'sold',
}

export enum ReservationStatus {
  Reserved = 'reserved',
  Converted = 'converted',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export enum ProjectType {
  HighRise = 'high_rise',
  MidRise = 'mid_rise',
  Village = 'village',
  Township = 'township',
  CommercialComplex = 'commercial_complex',
}

export enum ProjectStatus {
  Planning = 'planning',
  PreSelling = 'pre_selling',
  Construction = 'construction',
  FitOut = 'fit_out',
  Completed = 'completed',
  Turnover = 'turnover',
}

export enum PhaseStatus {
  Planning = 'planning',
  InProgress = 'in_progress',
  Completed = 'completed',
  Delayed = 'delayed',
  OnHold = 'on_hold',
}

export enum BudgetCategory {
  LandAcquisition = 'land_acquisition',
  Construction = 'construction',
  Permits = 'permits',
  ArchitecturalDesign = 'architectural_design',
  Engineering = 'engineering',
  InteriorFitOut = 'interior_fit_out',
  Landscaping = 'landscaping',
  Marketing = 'marketing',
  Contingency = 'contingency',
  Misc = 'misc',
}

export enum ContractorEngagementStatus {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
  Disputed = 'disputed',
}

export enum LeaseType {
  StandardRental = 'standard_rental',
  RentToOwn = 'rent_to_own',
  CorporateLease = 'corporate_lease',
  ShortTerm = 'short_term',
}

export enum RTOStatus {
  Active = 'active',
  GracePeriod = 'grace_period',
  Defaulted = 'defaulted',
  Exercised = 'exercised',
  Completed = 'completed',
}

export enum AgentTier {
  Junior = 'junior',
  Senior = 'senior',
  TeamLead = 'team_lead',
  ExternalBroker = 'external_broker',
}

export enum CommissionType {
  FlatAmount = 'flat_amount',
  PercentageOfSale = 'percentage_of_sale',
  PercentageOfRent = 'percentage_of_rent',
  Tiered = 'tiered',
}

export enum TransactionType {
  Sale = 'sale',
  RentalLease = 'rental_lease',
  RtoContract = 'rto_contract',
  LeaseRenewal = 'lease_renewal',
}

export enum CommissionStatus {
  Pending = 'pending',
  Approved = 'approved',
  PartiallyPaid = 'partially_paid',
  FullyPaid = 'fully_paid',
  Disputed = 'disputed',
}

export enum PaymentStatus {
  Pending = 'pending',
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Overdue = 'overdue',
  Waived = 'waived',
}

export enum InvoiceType {
  Rental = 'rental',
  UtilityWater = 'utility_water',
  UtilityElectricity = 'utility_electricity',
  AssociationDues = 'association_dues',
  LateFee = 'late_fee',
  DamageCharge = 'damage_charge',
  Misc = 'misc',
  Downpayment = 'downpayment',
  Reservation = 'reservation',
  EquityCredit = 'equity_credit',
}

export enum InvoiceStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Disputed = 'disputed',
  WrittenOff = 'written_off',
}

export enum PaymentArrangementStatus {
  Proposed = 'proposed',
  Approved = 'approved',
  Active = 'active',
  Completed = 'completed',
  Broken = 'broken',
}

export enum CollectionActionType {
  ReminderEmail = 'reminder_email',
  ReminderSms = 'reminder_sms',
  PhoneCall = 'phone_call',
  DemandLetter = 'demand_letter',
  SiteVisit = 'site_visit',
  LegalNotice = 'legal_notice',
}

export enum MeterType {
  Water = 'water',
  Electricity = 'electricity',
}

export enum UtilityType {
  Water = 'water',
  Electricity = 'electricity',
  Gas = 'gas',
}

export enum BillStatus {
  Pending = 'pending',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Waived = 'waived',
  Disputed = 'disputed',
}

export enum AmenityType {
  Gym = 'gym',
  Pool = 'pool',
  FunctionRoom = 'function_room',
  Parking = 'parking',
  Garden = 'garden',
  Other = 'other',
}

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum PostType {
  Announcement = 'announcement',
  Event = 'event',
}

export enum Audience {
  All = 'all',
  Building = 'building',
  Property = 'property',
  Unit = 'unit',
}

export enum ServiceCategory {
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  Hvac = 'hvac',
  General = 'general',
  Pest = 'pest',
  Elevator = 'elevator',
  Other = 'other',
}

export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Emergency = 'emergency',
}

export enum ServiceStatus {
  Open = 'open',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Rejected = 'rejected',
}

export enum WorkOrderStatus {
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum LeadStatus {
  New = 'new',
  Contacted = 'contacted',
  Qualified = 'qualified',
  Won = 'won',
  Lost = 'lost',
}

export interface SchemeListItem {
  id: string;
  schemeType: SchemeType | null;
  unitLabel: string | null;
  unitId: string | null;
  propertyId: string;
  propertyName: string | null;
  leaseType: LeaseType | null;
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

export enum ModerationStatus {
  Published = 'published',
  Hidden = 'hidden',
  Archived = 'archived',
}

export enum ReportStatus {
  Open = 'open',
  Reviewed = 'reviewed',
  Dismissed = 'dismissed',
  Actioned = 'actioned',
}

export enum ModerationTargetType {
  Post = 'post',
  Comment = 'comment',
}

export enum ModerationAction {
  Publish = 'publish',
  Hide = 'hide',
  Archive = 'archive',
  Restore = 'restore',
  Delete = 'delete',
  DismissReport = 'dismiss_report',
  ActionReport = 'action_report',
}

export enum DocOwnerType {
  Tenant = 'tenant',
  Owner = 'owner',
  Property = 'property',
  Lease = 'lease',
  Project = 'project',
  Unit = 'unit',
}

export enum DocumentType {
  LeaseAgreement = 'lease_agreement',
  IdProof = 'id_proof',
  TitleDeed = 'title_deed',
  Permit = 'permit',
  Insurance = 'insurance',
  Statement = 'statement',
  Other = 'other',
}

export enum SignatureStatus {
  Pending = 'pending',
  Sent = 'sent',
  Signed = 'signed',
  Declined = 'declined',
  Expired = 'expired',
}

export enum PnlStatus {
  Draft = 'draft',
  Issued = 'issued',
}

export enum ReminderType {
  PreDue = 'pre_due',
  PostDue = 'post_due',
  FinalNotice = 'final_notice',
}

export enum ReminderChannel {
  Email = 'email',
  Sms = 'sms',
  Portal = 'portal',
  Letter = 'letter',
}

export enum ReminderStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Acknowledged = 'acknowledged',
}

export enum StatementStatus {
  Draft = 'draft',
  Sent = 'sent',
  Disputed = 'disputed',
}

export enum CollectionActivityType {
  Call = 'call',
  Email = 'email',
  Letter = 'letter',
  Visit = 'visit',
  PaymentPromise = 'payment_promise',
  LegalNotice = 'legal_notice',
}

export enum CollectionCaseStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Escalated = 'escalated',
  Resolved = 'resolved',
  WrittenOff = 'written_off',
}

export enum CollectionCasePriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export enum SchemeType {
  StandardRentalMonthlyLeaseWithDepositPenaltyTerms = 'standard_rental // Monthly lease with deposit + penalty terms',
  SpotCashFullUpfrontPaymentWithOptionalDiscount = 'spot_cash // Full upfront payment with optional discount',
  InstallmentDPEquityBalancePhasesinhouseFinancing = 'installment // DP + Equity + Balance phases (in-house financing)',
  MortgageAssistedDPInhouseBalanceViaBankMortgage = 'mortgage_assisted // DP in-house, balance via bank mortgage',
  RentToOwnRentWithEquityAccumulationTowardPurchase = 'rent_to_own // Rent with equity accumulation toward purchase',
}

export enum TitleTransferStatus {
  PendingRequestedInitiatedAwaitingRequirements = 'pending // Requested / initiated, awaiting requirements',
  InProgressDocumentsBeingProcessedBIRRegistryOfDeeds = 'in_progress // Documents being processed (BIR, Registry of Deeds)',
  CompletedTitleTransferredBuyerIsNewOwnerOfRecord = 'completed // Title transferred; buyer is new owner of record',
  CancelledTransferAborted = 'cancelled // Transfer aborted',
}

export enum TitleTransferBasis {
  SpotCashFullyPaidInCash = 'spot_cash // Fully paid in cash',
  InstallmentPaidInhouseInstallmentFullyPaid = 'installment_paid // In-house installment fully paid',
  RtoExercisedRenttoownOptionExercisedEquityComplete = 'rto_exercised // Rent-to-own option exercised / equity complete',
  MortgageSettledBankPagIBIGLoanReleasedToDeveloper = 'mortgage_settled // Bank/Pag-IBIG loan released to developer',
  ManualAdministrativeOther = 'manual // Administrative / other',
}

export enum NotificationType {
  RentDue = 'rent_due',
  RentOverdue = 'rent_overdue',
  ServiceRequest = 'service_request',
  DocumentSignature = 'document_signature',
  CollectionCase = 'collection_case',
  Announcement = 'announcement',
  System = 'system',
}

export enum NotificationRole {
  Admin = 'admin',
  Owner = 'owner',
  Resident = 'resident',
}

export enum AccountType {
  Asset = 'asset',
  Liability = 'liability',
  Equity = 'equity',
  Revenue = 'revenue',
  Expense = 'expense',
}

export enum ApInvoiceStatus {
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Paid = 'paid',
  Cancelled = 'cancelled',
}
