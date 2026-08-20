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

export const userTypeLabels: Record<UserType, string> = {
  [UserType.SuperAdmin]: 'Super Admin',
  [UserType.Admin]: 'Admin',
  [UserType.PropertyManager]: 'Property Manager',
  [UserType.Finance]: 'Finance',
  [UserType.Agent]: 'Agent',
  [UserType.Owner]: 'Owner',
  [UserType.Tenant]: 'Tenant',
};

export enum PropertyType {
  CondoUnit = 'condo_unit',
  HouseAndLot = 'house_and_lot',
  Townhouse = 'townhouse',
  CommercialSpace = 'commercial_space',
  ParkingSlot = 'parking_slot',
}

export const propertyTypeLabels: Record<PropertyType, string> = {
  [PropertyType.CondoUnit]: 'Condo Unit',
  [PropertyType.HouseAndLot]: 'House And Lot',
  [PropertyType.Townhouse]: 'Townhouse',
  [PropertyType.CommercialSpace]: 'Commercial Space',
  [PropertyType.ParkingSlot]: 'Parking Slot',
};

export enum PropertyStatus {
  Available = 'available',
  Reserved = 'reserved',
  Sold = 'sold',
  Rented = 'rented',
  RtoActive = 'rto_active',
  UnderMaintenance = 'under_maintenance',
}

export const propertyStatusLabels: Record<PropertyStatus, string> = {
  [PropertyStatus.Available]: 'Available',
  [PropertyStatus.Reserved]: 'Reserved',
  [PropertyStatus.Sold]: 'Sold',
  [PropertyStatus.Rented]: 'Rented',
  [PropertyStatus.RtoActive]: 'RTO Active',
  [PropertyStatus.UnderMaintenance]: 'Under Maintenance',
};

export enum BuildingType {
  Tower = 'tower',
  MidRise = 'mid_rise',
  LowRise = 'low_rise',
  Cluster = 'cluster',
  Block = 'block',
}

export const buildingTypeLabels: Record<BuildingType, string> = {
  [BuildingType.Tower]: 'Tower',
  [BuildingType.MidRise]: 'Mid Rise',
  [BuildingType.LowRise]: 'Low Rise',
  [BuildingType.Cluster]: 'Cluster',
  [BuildingType.Block]: 'Block',
};

export enum UnitType {
  Studio = 'studio',
  OneBr = 'one_br',
  TwoBr = 'two_br',
  ThreeBr = 'three_br',
  Penthouse = 'penthouse',
  Commercial = 'commercial',
  Parking = 'parking',
}

export const unitTypeLabels: Record<UnitType, string> = {
  [UnitType.Studio]: 'Studio',
  [UnitType.OneBr]: 'One BR',
  [UnitType.TwoBr]: 'Two BR',
  [UnitType.ThreeBr]: 'Three BR',
  [UnitType.Penthouse]: 'Penthouse',
  [UnitType.Commercial]: 'Commercial',
  [UnitType.Parking]: 'Parking',
};

export enum UnitStatus {
  Available = 'available',
  Occupied = 'occupied',
  Reserved = 'reserved',
  UnderMaintenance = 'under_maintenance',
  Rented = 'rented',
  RtoActive = 'rto_active',
  Sold = 'sold',
}

export const unitStatusLabels: Record<UnitStatus, string> = {
  [UnitStatus.Available]: 'Available',
  [UnitStatus.Occupied]: 'Occupied',
  [UnitStatus.Reserved]: 'Reserved',
  [UnitStatus.UnderMaintenance]: 'Under Maintenance',
  [UnitStatus.Rented]: 'Rented',
  [UnitStatus.RtoActive]: 'RTO Active',
  [UnitStatus.Sold]: 'Sold',
};

export enum ReservationStatus {
  Reserved = 'reserved',
  Converted = 'converted',
  Expired = 'expired',
  Cancelled = 'cancelled',
}

export const reservationStatusLabels: Record<ReservationStatus, string> = {
  [ReservationStatus.Reserved]: 'Reserved',
  [ReservationStatus.Converted]: 'Converted',
  [ReservationStatus.Expired]: 'Expired',
  [ReservationStatus.Cancelled]: 'Cancelled',
};

export enum ProjectType {
  HighRise = 'high_rise',
  MidRise = 'mid_rise',
  Village = 'village',
  Township = 'township',
  CommercialComplex = 'commercial_complex',
}

export const projectTypeLabels: Record<ProjectType, string> = {
  [ProjectType.HighRise]: 'High Rise',
  [ProjectType.MidRise]: 'Mid Rise',
  [ProjectType.Village]: 'Village',
  [ProjectType.Township]: 'Township',
  [ProjectType.CommercialComplex]: 'Commercial Complex',
};

export enum ProjectStatus {
  Planning = 'planning',
  PreSelling = 'pre_selling',
  Construction = 'construction',
  FitOut = 'fit_out',
  Completed = 'completed',
  Turnover = 'turnover',
}

export const projectStatusLabels: Record<ProjectStatus, string> = {
  [ProjectStatus.Planning]: 'Planning',
  [ProjectStatus.PreSelling]: 'Pre Selling',
  [ProjectStatus.Construction]: 'Construction',
  [ProjectStatus.FitOut]: 'Fit Out',
  [ProjectStatus.Completed]: 'Completed',
  [ProjectStatus.Turnover]: 'Turnover',
};

export enum PhaseStatus {
  Planning = 'planning',
  InProgress = 'in_progress',
  Completed = 'completed',
  Delayed = 'delayed',
  OnHold = 'on_hold',
}

export const phaseStatusLabels: Record<PhaseStatus, string> = {
  [PhaseStatus.Planning]: 'Planning',
  [PhaseStatus.InProgress]: 'In Progress',
  [PhaseStatus.Completed]: 'Completed',
  [PhaseStatus.Delayed]: 'Delayed',
  [PhaseStatus.OnHold]: 'On Hold',
};

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

export const budgetCategoryLabels: Record<BudgetCategory, string> = {
  [BudgetCategory.LandAcquisition]: 'Land Acquisition',
  [BudgetCategory.Construction]: 'Construction',
  [BudgetCategory.Permits]: 'Permits',
  [BudgetCategory.ArchitecturalDesign]: 'Architectural Design',
  [BudgetCategory.Engineering]: 'Engineering',
  [BudgetCategory.InteriorFitOut]: 'Interior Fit Out',
  [BudgetCategory.Landscaping]: 'Landscaping',
  [BudgetCategory.Marketing]: 'Marketing',
  [BudgetCategory.Contingency]: 'Contingency',
  [BudgetCategory.Misc]: 'Misc',
};

export enum ContractorEngagementStatus {
  Pending = 'pending',
  Active = 'active',
  Completed = 'completed',
  Disputed = 'disputed',
}

export const contractorEngagementStatusLabels: Record<ContractorEngagementStatus, string> = {
  [ContractorEngagementStatus.Pending]: 'Pending',
  [ContractorEngagementStatus.Active]: 'Active',
  [ContractorEngagementStatus.Completed]: 'Completed',
  [ContractorEngagementStatus.Disputed]: 'Disputed',
};

export enum LeaseType {
  StandardRental = 'standard_rental',
  RentToOwn = 'rent_to_own',
  CorporateLease = 'corporate_lease',
  ShortTerm = 'short_term',
}

export const leaseTypeLabels: Record<LeaseType, string> = {
  [LeaseType.StandardRental]: 'Standard Rental',
  [LeaseType.RentToOwn]: 'Rent To Own',
  [LeaseType.CorporateLease]: 'Corporate Lease',
  [LeaseType.ShortTerm]: 'Short Term',
};

export enum RTOStatus {
  Active = 'active',
  GracePeriod = 'grace_period',
  Defaulted = 'defaulted',
  Exercised = 'exercised',
  Completed = 'completed',
}

export const rTOStatusLabels: Record<RTOStatus, string> = {
  [RTOStatus.Active]: 'Active',
  [RTOStatus.GracePeriod]: 'Grace Period',
  [RTOStatus.Defaulted]: 'Defaulted',
  [RTOStatus.Exercised]: 'Exercised',
  [RTOStatus.Completed]: 'Completed',
};

export enum AgentTier {
  Junior = 'junior',
  Senior = 'senior',
  TeamLead = 'team_lead',
  ExternalBroker = 'external_broker',
}

export const agentTierLabels: Record<AgentTier, string> = {
  [AgentTier.Junior]: 'Junior',
  [AgentTier.Senior]: 'Senior',
  [AgentTier.TeamLead]: 'Team Lead',
  [AgentTier.ExternalBroker]: 'External Broker',
};

export enum CommissionType {
  FlatAmount = 'flat_amount',
  PercentageOfSale = 'percentage_of_sale',
  PercentageOfRent = 'percentage_of_rent',
  Tiered = 'tiered',
}

export const commissionTypeLabels: Record<CommissionType, string> = {
  [CommissionType.FlatAmount]: 'Flat Amount',
  [CommissionType.PercentageOfSale]: 'Percentage Of Sale',
  [CommissionType.PercentageOfRent]: 'Percentage Of Rent',
  [CommissionType.Tiered]: 'Tiered',
};

export enum TransactionType {
  Sale = 'sale',
  RentalLease = 'rental_lease',
  RtoContract = 'rto_contract',
  LeaseRenewal = 'lease_renewal',
}

export const transactionTypeLabels: Record<TransactionType, string> = {
  [TransactionType.Sale]: 'Sale',
  [TransactionType.RentalLease]: 'Rental Lease',
  [TransactionType.RtoContract]: 'RTO Contract',
  [TransactionType.LeaseRenewal]: 'Lease Renewal',
};

export enum CommissionStatus {
  Pending = 'pending',
  Approved = 'approved',
  PartiallyPaid = 'partially_paid',
  FullyPaid = 'fully_paid',
  Disputed = 'disputed',
}

export const commissionStatusLabels: Record<CommissionStatus, string> = {
  [CommissionStatus.Pending]: 'Pending',
  [CommissionStatus.Approved]: 'Approved',
  [CommissionStatus.PartiallyPaid]: 'Partially Paid',
  [CommissionStatus.FullyPaid]: 'Fully Paid',
  [CommissionStatus.Disputed]: 'Disputed',
};

export enum PaymentStatus {
  Pending = 'pending',
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Overdue = 'overdue',
  Waived = 'waived',
}

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  [PaymentStatus.Pending]: 'Pending',
  [PaymentStatus.PendingApproval]: 'Pending Approval',
  [PaymentStatus.Approved]: 'Approved',
  [PaymentStatus.Paid]: 'Paid',
  [PaymentStatus.PartiallyPaid]: 'Partially Paid',
  [PaymentStatus.Overdue]: 'Overdue',
  [PaymentStatus.Waived]: 'Waived',
};

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

export const invoiceTypeLabels: Record<InvoiceType, string> = {
  [InvoiceType.Rental]: 'Rental',
  [InvoiceType.UtilityWater]: 'Utility Water',
  [InvoiceType.UtilityElectricity]: 'Utility Electricity',
  [InvoiceType.AssociationDues]: 'Association Dues',
  [InvoiceType.LateFee]: 'Late Fee',
  [InvoiceType.DamageCharge]: 'Damage Charge',
  [InvoiceType.Misc]: 'Misc',
  [InvoiceType.Downpayment]: 'Downpayment',
  [InvoiceType.Reservation]: 'Reservation',
  [InvoiceType.EquityCredit]: 'Equity Credit',
};

export enum InvoiceStatus {
  Pending = 'pending',
  PartiallyPaid = 'partially_paid',
  Paid = 'paid',
  Overdue = 'overdue',
  Disputed = 'disputed',
  WrittenOff = 'written_off',
}

export const invoiceStatusLabels: Record<InvoiceStatus, string> = {
  [InvoiceStatus.Pending]: 'Pending',
  [InvoiceStatus.PartiallyPaid]: 'Partially Paid',
  [InvoiceStatus.Paid]: 'Paid',
  [InvoiceStatus.Overdue]: 'Overdue',
  [InvoiceStatus.Disputed]: 'Disputed',
  [InvoiceStatus.WrittenOff]: 'Written Off',
};

export enum PaymentArrangementStatus {
  Proposed = 'proposed',
  Approved = 'approved',
  Active = 'active',
  Completed = 'completed',
  Broken = 'broken',
}

export const paymentArrangementStatusLabels: Record<PaymentArrangementStatus, string> = {
  [PaymentArrangementStatus.Proposed]: 'Proposed',
  [PaymentArrangementStatus.Approved]: 'Approved',
  [PaymentArrangementStatus.Active]: 'Active',
  [PaymentArrangementStatus.Completed]: 'Completed',
  [PaymentArrangementStatus.Broken]: 'Broken',
};

export enum CollectionActionType {
  ReminderEmail = 'reminder_email',
  ReminderSms = 'reminder_sms',
  PhoneCall = 'phone_call',
  DemandLetter = 'demand_letter',
  SiteVisit = 'site_visit',
  LegalNotice = 'legal_notice',
}

export const collectionActionTypeLabels: Record<CollectionActionType, string> = {
  [CollectionActionType.ReminderEmail]: 'Reminder Email',
  [CollectionActionType.ReminderSms]: 'Reminder SMS',
  [CollectionActionType.PhoneCall]: 'Phone Call',
  [CollectionActionType.DemandLetter]: 'Demand Letter',
  [CollectionActionType.SiteVisit]: 'Site Visit',
  [CollectionActionType.LegalNotice]: 'Legal Notice',
};

export enum MeterType {
  Water = 'water',
  Electricity = 'electricity',
}

export const meterTypeLabels: Record<MeterType, string> = {
  [MeterType.Water]: 'Water',
  [MeterType.Electricity]: 'Electricity',
};

export enum UtilityType {
  Water = 'water',
  Electricity = 'electricity',
  Gas = 'gas',
}

export const utilityTypeLabels: Record<UtilityType, string> = {
  [UtilityType.Water]: 'Water',
  [UtilityType.Electricity]: 'Electricity',
  [UtilityType.Gas]: 'Gas',
};

export enum BillStatus {
  Pending = 'pending',
  Paid = 'paid',
  PartiallyPaid = 'partially_paid',
  Waived = 'waived',
  Disputed = 'disputed',
}

export const billStatusLabels: Record<BillStatus, string> = {
  [BillStatus.Pending]: 'Pending',
  [BillStatus.Paid]: 'Paid',
  [BillStatus.PartiallyPaid]: 'Partially Paid',
  [BillStatus.Waived]: 'Waived',
  [BillStatus.Disputed]: 'Disputed',
};

export enum AmenityType {
  Gym = 'gym',
  Pool = 'pool',
  FunctionRoom = 'function_room',
  Parking = 'parking',
  Garden = 'garden',
  Other = 'other',
}

export const amenityTypeLabels: Record<AmenityType, string> = {
  [AmenityType.Gym]: 'Gym',
  [AmenityType.Pool]: 'Pool',
  [AmenityType.FunctionRoom]: 'Function Room',
  [AmenityType.Parking]: 'Parking',
  [AmenityType.Garden]: 'Garden',
  [AmenityType.Other]: 'Other',
};

export enum BookingStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export const bookingStatusLabels: Record<BookingStatus, string> = {
  [BookingStatus.Pending]: 'Pending',
  [BookingStatus.Confirmed]: 'Confirmed',
  [BookingStatus.Completed]: 'Completed',
  [BookingStatus.Cancelled]: 'Cancelled',
};

export enum PostType {
  Announcement = 'announcement',
  Event = 'event',
}

export const postTypeLabels: Record<PostType, string> = {
  [PostType.Announcement]: 'Announcement',
  [PostType.Event]: 'Event',
};

export enum Audience {
  All = 'all',
  Building = 'building',
  Property = 'property',
  Unit = 'unit',
}

export const audienceLabels: Record<Audience, string> = {
  [Audience.All]: 'All',
  [Audience.Building]: 'Building',
  [Audience.Property]: 'Property',
  [Audience.Unit]: 'Unit',
};

export enum ServiceCategory {
  Plumbing = 'plumbing',
  Electrical = 'electrical',
  Hvac = 'hvac',
  General = 'general',
  Pest = 'pest',
  Elevator = 'elevator',
  Other = 'other',
}

export const serviceCategoryLabels: Record<ServiceCategory, string> = {
  [ServiceCategory.Plumbing]: 'Plumbing',
  [ServiceCategory.Electrical]: 'Electrical',
  [ServiceCategory.Hvac]: 'Hvac',
  [ServiceCategory.General]: 'General',
  [ServiceCategory.Pest]: 'Pest',
  [ServiceCategory.Elevator]: 'Elevator',
  [ServiceCategory.Other]: 'Other',
};

export enum Priority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Emergency = 'emergency',
}

export const priorityLabels: Record<Priority, string> = {
  [Priority.Low]: 'Low',
  [Priority.Medium]: 'Medium',
  [Priority.High]: 'High',
  [Priority.Emergency]: 'Emergency',
};

export enum ServiceStatus {
  Open = 'open',
  Assigned = 'assigned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Rejected = 'rejected',
}

export const serviceStatusLabels: Record<ServiceStatus, string> = {
  [ServiceStatus.Open]: 'Open',
  [ServiceStatus.Assigned]: 'Assigned',
  [ServiceStatus.InProgress]: 'In Progress',
  [ServiceStatus.Completed]: 'Completed',
  [ServiceStatus.Cancelled]: 'Cancelled',
  [ServiceStatus.Rejected]: 'Rejected',
};

export enum WorkOrderStatus {
  Scheduled = 'scheduled',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export const workOrderStatusLabels: Record<WorkOrderStatus, string> = {
  [WorkOrderStatus.Scheduled]: 'Scheduled',
  [WorkOrderStatus.InProgress]: 'In Progress',
  [WorkOrderStatus.Completed]: 'Completed',
  [WorkOrderStatus.Cancelled]: 'Cancelled',
};

export enum LeadStatus {
  New = 'new',
  Contacted = 'contacted',
  Qualified = 'qualified',
  Won = 'won',
  Lost = 'lost',
}

export const leadStatusLabels: Record<LeadStatus, string> = {
  [LeadStatus.New]: 'New',
  [LeadStatus.Contacted]: 'Contacted',
  [LeadStatus.Qualified]: 'Qualified',
  [LeadStatus.Won]: 'Won',
  [LeadStatus.Lost]: 'Lost',
};

export enum ModerationStatus {
  Published = 'published',
  Hidden = 'hidden',
  Archived = 'archived',
}

export const moderationStatusLabels: Record<ModerationStatus, string> = {
  [ModerationStatus.Published]: 'Published',
  [ModerationStatus.Hidden]: 'Hidden',
  [ModerationStatus.Archived]: 'Archived',
};

export enum ReportStatus {
  Open = 'open',
  Reviewed = 'reviewed',
  Dismissed = 'dismissed',
  Actioned = 'actioned',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  [ReportStatus.Open]: 'Open',
  [ReportStatus.Reviewed]: 'Reviewed',
  [ReportStatus.Dismissed]: 'Dismissed',
  [ReportStatus.Actioned]: 'Actioned',
};

export enum ModerationTargetType {
  Post = 'post',
  Comment = 'comment',
}

export const moderationTargetTypeLabels: Record<ModerationTargetType, string> = {
  [ModerationTargetType.Post]: 'Post',
  [ModerationTargetType.Comment]: 'Comment',
};

export enum ModerationAction {
  Publish = 'publish',
  Hide = 'hide',
  Archive = 'archive',
  Restore = 'restore',
  Delete = 'delete',
  DismissReport = 'dismiss_report',
  ActionReport = 'action_report',
}

export const moderationActionLabels: Record<ModerationAction, string> = {
  [ModerationAction.Publish]: 'Publish',
  [ModerationAction.Hide]: 'Hide',
  [ModerationAction.Archive]: 'Archive',
  [ModerationAction.Restore]: 'Restore',
  [ModerationAction.Delete]: 'Delete',
  [ModerationAction.DismissReport]: 'Dismiss Report',
  [ModerationAction.ActionReport]: 'Action Report',
};

export enum DocOwnerType {
  Tenant = 'tenant',
  Owner = 'owner',
  Property = 'property',
  Lease = 'lease',
  Project = 'project',
  Unit = 'unit',
}

export const docOwnerTypeLabels: Record<DocOwnerType, string> = {
  [DocOwnerType.Tenant]: 'Tenant',
  [DocOwnerType.Owner]: 'Owner',
  [DocOwnerType.Property]: 'Property',
  [DocOwnerType.Lease]: 'Lease',
  [DocOwnerType.Project]: 'Project',
  [DocOwnerType.Unit]: 'Unit',
};

export enum DocumentType {
  LeaseAgreement = 'lease_agreement',
  IdProof = 'id_proof',
  TitleDeed = 'title_deed',
  Permit = 'permit',
  Insurance = 'insurance',
  Statement = 'statement',
  Other = 'other',
}

export const documentTypeLabels: Record<DocumentType, string> = {
  [DocumentType.LeaseAgreement]: 'Lease Agreement',
  [DocumentType.IdProof]: 'ID Proof',
  [DocumentType.TitleDeed]: 'Title Deed',
  [DocumentType.Permit]: 'Permit',
  [DocumentType.Insurance]: 'Insurance',
  [DocumentType.Statement]: 'Statement',
  [DocumentType.Other]: 'Other',
};

export enum SignatureStatus {
  Pending = 'pending',
  Sent = 'sent',
  Signed = 'signed',
  Declined = 'declined',
  Expired = 'expired',
}

export const signatureStatusLabels: Record<SignatureStatus, string> = {
  [SignatureStatus.Pending]: 'Pending',
  [SignatureStatus.Sent]: 'Sent',
  [SignatureStatus.Signed]: 'Signed',
  [SignatureStatus.Declined]: 'Declined',
  [SignatureStatus.Expired]: 'Expired',
};

export enum PnlStatus {
  Draft = 'draft',
  Issued = 'issued',
}

export const pnlStatusLabels: Record<PnlStatus, string> = {
  [PnlStatus.Draft]: 'Draft',
  [PnlStatus.Issued]: 'Issued',
};

export enum ReminderType {
  PreDue = 'pre_due',
  PostDue = 'post_due',
  FinalNotice = 'final_notice',
}

export const reminderTypeLabels: Record<ReminderType, string> = {
  [ReminderType.PreDue]: 'Pre Due',
  [ReminderType.PostDue]: 'Post Due',
  [ReminderType.FinalNotice]: 'Final Notice',
};

export enum ReminderChannel {
  Email = 'email',
  Sms = 'sms',
  Portal = 'portal',
  Letter = 'letter',
}

export const reminderChannelLabels: Record<ReminderChannel, string> = {
  [ReminderChannel.Email]: 'Email',
  [ReminderChannel.Sms]: 'SMS',
  [ReminderChannel.Portal]: 'Portal',
  [ReminderChannel.Letter]: 'Letter',
};

export enum ReminderStatus {
  Pending = 'pending',
  Sent = 'sent',
  Failed = 'failed',
  Acknowledged = 'acknowledged',
}

export const reminderStatusLabels: Record<ReminderStatus, string> = {
  [ReminderStatus.Pending]: 'Pending',
  [ReminderStatus.Sent]: 'Sent',
  [ReminderStatus.Failed]: 'Failed',
  [ReminderStatus.Acknowledged]: 'Acknowledged',
};

export enum StatementStatus {
  Draft = 'draft',
  Sent = 'sent',
  Disputed = 'disputed',
}

export const statementStatusLabels: Record<StatementStatus, string> = {
  [StatementStatus.Draft]: 'Draft',
  [StatementStatus.Sent]: 'Sent',
  [StatementStatus.Disputed]: 'Disputed',
};

export enum CollectionActivityType {
  Call = 'call',
  Email = 'email',
  Letter = 'letter',
  Visit = 'visit',
  PaymentPromise = 'payment_promise',
  LegalNotice = 'legal_notice',
}

export const collectionActivityTypeLabels: Record<CollectionActivityType, string> = {
  [CollectionActivityType.Call]: 'Call',
  [CollectionActivityType.Email]: 'Email',
  [CollectionActivityType.Letter]: 'Letter',
  [CollectionActivityType.Visit]: 'Visit',
  [CollectionActivityType.PaymentPromise]: 'Payment Promise',
  [CollectionActivityType.LegalNotice]: 'Legal Notice',
};

export enum CollectionCaseStatus {
  Open = 'open',
  InProgress = 'in_progress',
  Escalated = 'escalated',
  Resolved = 'resolved',
  WrittenOff = 'written_off',
}

export const collectionCaseStatusLabels: Record<CollectionCaseStatus, string> = {
  [CollectionCaseStatus.Open]: 'Open',
  [CollectionCaseStatus.InProgress]: 'In Progress',
  [CollectionCaseStatus.Escalated]: 'Escalated',
  [CollectionCaseStatus.Resolved]: 'Resolved',
  [CollectionCaseStatus.WrittenOff]: 'Written Off',
};

export enum CollectionCasePriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export const collectionCasePriorityLabels: Record<CollectionCasePriority, string> = {
  [CollectionCasePriority.Low]: 'Low',
  [CollectionCasePriority.Medium]: 'Medium',
  [CollectionCasePriority.High]: 'High',
  [CollectionCasePriority.Critical]: 'Critical',
};

export enum SchemeType {
  StandardRentalMonthlyLeaseWithDepositPenaltyTerms = 'standard_rental // Monthly lease with deposit + penalty terms',
  SpotCashFullUpfrontPaymentWithOptionalDiscount = 'spot_cash // Full upfront payment with optional discount',
  InstallmentDPEquityBalancePhasesinhouseFinancing = 'installment // DP + Equity + Balance phases (in-house financing)',
  MortgageAssistedDPInhouseBalanceViaBankMortgage = 'mortgage_assisted // DP in-house, balance via bank mortgage',
  RentToOwnRentWithEquityAccumulationTowardPurchase = 'rent_to_own // Rent with equity accumulation toward purchase',
}

export const schemeTypeLabels: Record<SchemeType, string> = {
  [SchemeType.StandardRentalMonthlyLeaseWithDepositPenaltyTerms]:
    'Standard Rental // Monthly Lease With Deposit + Penalty Terms',
  [SchemeType.SpotCashFullUpfrontPaymentWithOptionalDiscount]:
    'Spot Cash // Full Upfront Payment With Optional Discount',
  [SchemeType.InstallmentDPEquityBalancePhasesinhouseFinancing]:
    'Installment // Dp + Equity + Balance Phases (in House Financing)',
  [SchemeType.MortgageAssistedDPInhouseBalanceViaBankMortgage]:
    'Mortgage Assisted // Dp In House, Balance Via Bank Mortgage',
  [SchemeType.RentToOwnRentWithEquityAccumulationTowardPurchase]:
    'Rent To Own // Rent With Equity Accumulation Toward Purchase',
};

export enum TitleTransferStatus {
  PendingRequestedInitiatedAwaitingRequirements = 'pending // Requested / initiated, awaiting requirements',
  InProgressDocumentsBeingProcessedBIRRegistryOfDeeds = 'in_progress // Documents being processed (BIR, Registry of Deeds)',
  CompletedTitleTransferredBuyerIsNewOwnerOfRecord = 'completed // Title transferred; buyer is new owner of record',
  CancelledTransferAborted = 'cancelled // Transfer aborted',
}

export const titleTransferStatusLabels: Record<TitleTransferStatus, string> = {
  [TitleTransferStatus.PendingRequestedInitiatedAwaitingRequirements]:
    'Pending // Requested / Initiated, Awaiting Requirements',
  [TitleTransferStatus.InProgressDocumentsBeingProcessedBIRRegistryOfDeeds]:
    'In Progress // Documents Being Processed (bir, Registry Of Deeds)',
  [TitleTransferStatus.CompletedTitleTransferredBuyerIsNewOwnerOfRecord]:
    'Completed // Title Transferred; Buyer Is New Owner Of Record',
  [TitleTransferStatus.CancelledTransferAborted]: 'Cancelled // Transfer Aborted',
};

export enum TitleTransferBasis {
  SpotCashFullyPaidInCash = 'spot_cash // Fully paid in cash',
  InstallmentPaidInhouseInstallmentFullyPaid = 'installment_paid // In-house installment fully paid',
  RtoExercisedRenttoownOptionExercisedEquityComplete = 'rto_exercised // Rent-to-own option exercised / equity complete',
  MortgageSettledBankPagIBIGLoanReleasedToDeveloper = 'mortgage_settled // Bank/Pag-IBIG loan released to developer',
  ManualAdministrativeOther = 'manual // Administrative / other',
}

export const titleTransferBasisLabels: Record<TitleTransferBasis, string> = {
  [TitleTransferBasis.SpotCashFullyPaidInCash]: 'Spot Cash // Fully Paid In Cash',
  [TitleTransferBasis.InstallmentPaidInhouseInstallmentFullyPaid]:
    'Installment Paid // In House Installment Fully Paid',
  [TitleTransferBasis.RtoExercisedRenttoownOptionExercisedEquityComplete]:
    'RTO Exercised // Rent To Own Option Exercised / Equity Complete',
  [TitleTransferBasis.MortgageSettledBankPagIBIGLoanReleasedToDeveloper]:
    'Mortgage Settled // Bank/pag Ibig Loan Released To Developer',
  [TitleTransferBasis.ManualAdministrativeOther]: 'Manual // Administrative / Other',
};

export enum NotificationType {
  RentDue = 'rent_due',
  RentOverdue = 'rent_overdue',
  ServiceRequest = 'service_request',
  DocumentSignature = 'document_signature',
  CollectionCase = 'collection_case',
  Announcement = 'announcement',
  System = 'system',
}

export const notificationTypeLabels: Record<NotificationType, string> = {
  [NotificationType.RentDue]: 'Rent Due',
  [NotificationType.RentOverdue]: 'Rent Overdue',
  [NotificationType.ServiceRequest]: 'Service Request',
  [NotificationType.DocumentSignature]: 'Document Signature',
  [NotificationType.CollectionCase]: 'Collection Case',
  [NotificationType.Announcement]: 'Announcement',
  [NotificationType.System]: 'System',
};

export enum NotificationRole {
  Admin = 'admin',
  Owner = 'owner',
  Resident = 'resident',
}

export const notificationRoleLabels: Record<NotificationRole, string> = {
  [NotificationRole.Admin]: 'Admin',
  [NotificationRole.Owner]: 'Owner',
  [NotificationRole.Resident]: 'Resident',
};

export enum AccountType {
  Asset = 'asset',
  Liability = 'liability',
  Equity = 'equity',
  Revenue = 'revenue',
  Expense = 'expense',
}

export const accountTypeLabels: Record<AccountType, string> = {
  [AccountType.Asset]: 'Asset',
  [AccountType.Liability]: 'Liability',
  [AccountType.Equity]: 'Equity',
  [AccountType.Revenue]: 'Revenue',
  [AccountType.Expense]: 'Expense',
};

export enum ApInvoiceStatus {
  PendingApproval = 'pending_approval',
  Approved = 'approved',
  Paid = 'paid',
  Cancelled = 'cancelled',
}

export const apInvoiceStatusLabels: Record<ApInvoiceStatus, string> = {
  [ApInvoiceStatus.PendingApproval]: 'Pending Approval',
  [ApInvoiceStatus.Approved]: 'Approved',
  [ApInvoiceStatus.Paid]: 'Paid',
  [ApInvoiceStatus.Cancelled]: 'Cancelled',
};
