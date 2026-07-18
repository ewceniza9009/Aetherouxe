import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuth } from "@elite-realty/shared-ui/hooks";
import type { ApiResponse } from "@elite-realty/shared-types";

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type AmenityType =
  | "gym"
  | "pool"
  | "lounge"
  | "parking"
  | "rooftop"
  | "bbq"
  | "study"
  | "tennis"
  | "sauna"
  | "playground"
  | "other";

export interface Amenity {
  id: string;
  name: string;
  description?: string | null;
  amenityType: AmenityType;
  location?: string | null;
  capacity?: number | null;
  isActive: boolean;
}

export type BookingStatus = "requested" | "confirmed" | "completed" | "cancelled";

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName?: string | null;
  tenantId: string;
  startDateTime: string;
  endDateTime: string;
  notes?: string | null;
  status: BookingStatus;
  createdAt: string;
}

export type CommunityPostType = "announcement" | "event" | "general" | "alert";

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  postType: CommunityPostType;
  author?: string | null;
  audience?: string | null;
  scheduledDate?: string | null;
  isPinned?: boolean;
  createdAt: string;
}

export type ServiceCategory =
  | "maintenance"
  | "plumbing"
  | "electrical"
  | "hvac"
  | "appliance"
  | "pest_control"
  | "landscaping"
  | "security"
  | "other";

export type ServicePriority = "low" | "medium" | "high" | "urgent";

export type ServiceStatus =
  | "submitted"
  | "in_progress"
  | "scheduled"
  | "completed"
  | "cancelled"
  | "on_hold";

export interface ServiceRequest {
  id: string;
  tenantId: string;
  category: ServiceCategory;
  priority: ServicePriority;
  description: string;
  status: ServiceStatus;
  unitId?: string | null;
  unitLabel?: string | null;
  propertyName?: string | null;
  requestedDate?: string | null;
  createdAt: string;
  resolvedAt?: string | null;
}

export type ResidentDocumentType =
  | "lease"
  | "statement"
  | "tax"
  | "legal"
  | "inspection"
  | "policy"
  | "addendum"
  | "form"
  | "insurance"
  | "other";

export interface ResidentDocument {
  id: string;
  title: string;
  documentType: ResidentDocumentType;
  fileUrl?: string | null;
  isSigned: boolean;
  signedAt?: string | null;
  propertyName?: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ *
 * Small inline color / label maps
 * ------------------------------------------------------------------ */

export const AMENITY_TYPE_STYLES: Record<AmenityType, { label: string; className: string }> = {
  gym: { label: "Gym", className: "bg-rose-100 text-rose-700" },
  pool: { label: "Pool", className: "bg-sky-100 text-sky-700" },
  lounge: { label: "Lounge", className: "bg-violet-100 text-violet-700" },
  parking: { label: "Parking", className: "bg-slate-100 text-slate-700" },
  rooftop: { label: "Rooftop", className: "bg-amber-100 text-amber-700" },
  bbq: { label: "BBQ", className: "bg-orange-100 text-orange-700" },
  study: { label: "Study", className: "bg-teal-100 text-teal-700" },
  tennis: { label: "Tennis", className: "bg-lime-100 text-lime-700" },
  sauna: { label: "Sauna", className: "bg-pink-100 text-pink-700" },
  playground: { label: "Playground", className: "bg-cyan-100 text-cyan-700" },
  other: { label: "Other", className: "bg-gray-100 text-gray-700" },
};

export const BOOKING_STATUS_STYLES: Record<BookingStatus, { label: string; className: string }> = {
  requested: { label: "Requested", className: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmed", className: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
};

export const POST_TYPE_STYLES: Record<CommunityPostType, { label: string; className: string }> = {
  announcement: { label: "Announcement", className: "bg-primary/15 text-primary" },
  event: { label: "Event", className: "bg-violet-100 text-violet-700" },
  general: { label: "General", className: "bg-slate-100 text-slate-700" },
  alert: { label: "Alert", className: "bg-rose-100 text-rose-700" },
};

export const SERVICE_CATEGORY_STYLES: Record<ServiceCategory, { label: string; className: string }> = {
  maintenance: { label: "Maintenance", className: "bg-slate-100 text-slate-700" },
  plumbing: { label: "Plumbing", className: "bg-sky-100 text-sky-700" },
  electrical: { label: "Electrical", className: "bg-amber-100 text-amber-700" },
  hvac: { label: "HVAC", className: "bg-cyan-100 text-cyan-700" },
  appliance: { label: "Appliance", className: "bg-teal-100 text-teal-700" },
  pest_control: { label: "Pest Control", className: "bg-lime-100 text-lime-700" },
  landscaping: { label: "Landscaping", className: "bg-green-100 text-green-700" },
  security: { label: "Security", className: "bg-rose-100 text-rose-700" },
  other: { label: "Other", className: "bg-gray-100 text-gray-700" },
};

export const SERVICE_PRIORITY_STYLES: Record<ServicePriority, { label: string; className: string }> = {
  low: { label: "Low", className: "bg-slate-100 text-slate-600" },
  medium: { label: "Medium", className: "bg-blue-100 text-blue-700" },
  high: { label: "High", className: "bg-orange-100 text-orange-700" },
  urgent: { label: "Urgent", className: "bg-rose-100 text-rose-700" },
};

export const SERVICE_STATUS_STYLES: Record<ServiceStatus, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-slate-100 text-slate-700" },
  in_progress: { label: "In Progress", className: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", className: "bg-violet-100 text-violet-700" },
  completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", className: "bg-gray-100 text-gray-600" },
  on_hold: { label: "On Hold", className: "bg-amber-100 text-amber-700" },
};

export const DOCUMENT_TYPE_STYLES: Record<ResidentDocumentType, { label: string; className: string }> = {
  lease: { label: "Lease", className: "bg-violet-100 text-violet-700" },
  statement: { label: "Statement", className: "bg-sky-100 text-sky-700" },
  tax: { label: "Tax", className: "bg-rose-100 text-rose-700" },
  legal: { label: "Legal", className: "bg-indigo-100 text-indigo-700" },
  inspection: { label: "Inspection", className: "bg-teal-100 text-teal-700" },
  policy: { label: "Policy", className: "bg-cyan-100 text-cyan-700" },
  addendum: { label: "Addendum", className: "bg-fuchsia-100 text-fuchsia-700" },
  form: { label: "Form", className: "bg-amber-100 text-amber-700" },
  insurance: { label: "Insurance", className: "bg-emerald-100 text-emerald-700" },
  other: { label: "Other", className: "bg-slate-100 text-slate-700" },
};

/* ------------------------------------------------------------------ *
 * Formatting helpers
 * ------------------------------------------------------------------ */

export function formatDate(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/* ------------------------------------------------------------------ *
 * Queries
 * ------------------------------------------------------------------ */

export function useMyBookings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set("tenantId", user.id);
      const { data } = await api.get<ApiResponse<AmenityBooking[]>>(`/amenity-bookings?${params.toString()}`);
      return (data.data ?? []) as AmenityBooking[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateBooking() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      amenityId: string;
      startDateTime: string;
      endDateTime: string;
      notes?: string;
    }) => {
      const { data } = await api.post<ApiResponse<AmenityBooking>>("/amenity-bookings", {
        ...input,
        tenantId: user?.id,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings", user?.id] });
    },
  });
}

export function useCommunityPosts() {
  return useQuery({
    queryKey: ["community-posts"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CommunityPost[]>>(`/community-posts`);
      return (data.data ?? []) as CommunityPost[];
    },
  });
}

export function useAmenities() {
  return useQuery({
    queryKey: ["amenities"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("isActive", "true");
      const { data } = await api.get<ApiResponse<Amenity[]>>(`/amenities?${params.toString()}`);
      return (data.data ?? []) as Amenity[];
    },
  });
}

export function useMyServiceRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-service-requests", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.set("tenantId", user.id);
      const { data } = await api.get<ApiResponse<ServiceRequest[]>>(`/service-requests?${params.toString()}`);
      return (data.data ?? []) as ServiceRequest[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateServiceRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      category: ServiceCategory;
      priority: ServicePriority;
      description: string;
      unitId?: string;
      propertyName?: string;
    }) => {
      const { data } = await api.post<ApiResponse<ServiceRequest>>("/service-requests", {
        ...input,
        tenantId: user?.id,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-service-requests", user?.id] });
    },
  });
}

export function useMyDocuments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["resident-documents", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("ownerType", "tenant");
      if (user?.id) params.set("ownerId", user.id);
      const { data } = await api.get<ApiResponse<ResidentDocument[]>>(`/documents?${params.toString()}`);
      return (data.data ?? []) as ResidentDocument[];
    },
    enabled: !!user?.id,
  });
}

