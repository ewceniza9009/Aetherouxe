export interface PermissionDefinition {
  id: string;
  label: string;
  description: string;
  category: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // User Management
  {
    id: 'manage_users',
    label: 'Manage Users',
    description: 'Create, update, deactivate, and assign roles to users',
    category: 'User Management',
  },
  {
    id: 'view_users',
    label: 'View Users',
    description: 'View user directory and profiles',
    category: 'User Management',
  },

  // Role & Access Management
  {
    id: 'manage_roles',
    label: 'Manage Roles',
    description: 'Create, edit, and delete custom RBAC roles and permissions',
    category: 'Access Control',
  },
  {
    id: 'view_roles',
    label: 'View Roles',
    description: 'View custom roles and assigned permissions',
    category: 'Access Control',
  },

  // Property & Inventory Management
  {
    id: 'manage_properties',
    label: 'Manage Properties',
    description: 'Create, update, and manage properties, buildings, and phases',
    category: 'Property Management',
  },
  {
    id: 'view_properties',
    label: 'View Properties',
    description: 'View properties, buildings, and project details',
    category: 'Property Management',
  },
  {
    id: 'manage_units',
    label: 'Manage Units',
    description: 'Create, update, and manage property units and availability',
    category: 'Property Management',
  },

  // Lease & Tenancy Management
  {
    id: 'manage_leases',
    label: 'Manage Leases',
    description: 'Create, update, renew, and terminate lease agreements',
    category: 'Lease Management',
  },
  {
    id: 'view_leases',
    label: 'View Leases',
    description: 'View lease agreements, RTO contracts, and payment schedules',
    category: 'Lease Management',
  },

  // Financials & Accounting
  {
    id: 'view_financials',
    label: 'View Financials',
    description: 'Read-only access to General Ledger, AR/AP invoices, and SOA',
    category: 'Financials',
  },
  {
    id: 'manage_invoices',
    label: 'Manage Invoices & Payments',
    description: 'Create AR invoices, record rental payments, and manage collection cases',
    category: 'Financials',
  },
  {
    id: 'approve_disbursements',
    label: 'Approve Disbursements',
    description: 'Approve AP invoices and vendor disbursements',
    category: 'Financials',
  },

  // Maintenance & Operations
  {
    id: 'manage_maintenance',
    label: 'Manage Maintenance',
    description: 'Create work orders, assign contractors, and resolve service requests',
    category: 'Operations',
  },
  {
    id: 'view_maintenance',
    label: 'View Maintenance',
    description: 'View service requests and work order progress',
    category: 'Operations',
  },

  // Community & Amenities
  {
    id: 'manage_community',
    label: 'Manage Community & Amenities',
    description: 'Post community announcements, manage amenity bookings, and moderate posts',
    category: 'Community',
  },
  {
    id: 'view_community',
    label: 'View Community & Amenities',
    description: 'View community feed and amenity schedules',
    category: 'Community',
  },

  // Reports & Analytics
  {
    id: 'view_reports',
    label: 'View Reports & Analytics',
    description: 'View executive dashboard analytics, P&L statements, and occupancy metrics',
    category: 'Reports',
  },
];

export const ALL_PERMISSION_IDS = SYSTEM_PERMISSIONS.map((p) => p.id);
