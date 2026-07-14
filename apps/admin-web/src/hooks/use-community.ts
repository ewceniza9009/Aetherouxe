import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type AmenityType =
  | "gym"
  | "pool"
  | "function_room"
  | "parking"
  | "garden"
  | "other";

export type AmenityBookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export type PostType =
  | "announcement"
  | "event"
  | "maintenance"
  | "general"
  | "emergency";

export type PostAudience = "all" | "tenants" | "owners" | "staff" | "property";

export interface Amenity {
  id: string;
  name: string;
  type: AmenityType;
  description?: string | null;
  location?: string | null;
  propertyId?: string | null;
  propertyName?: string | null;
  capacity?: number | null;
  hourlyRate?: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface AmenityBooking {
  id: string;
  amenityId: string;
  amenityName?: string | null;
  tenantName?: string | null;
  tenantId?: string | null;
  unitLabel?: string | null;
  unitId?: string | null;
  startDateTime: string;
  endDateTime: string;
  amount?: number | null;
  notes?: string | null;
  status: AmenityBookingStatus;
  createdAt: string;
}

export interface CommunityPost {
  id: string;
  title: string;
  body: string;
  postType: PostType;
  audience: PostAudience;
  propertyId?: string | null;
  propertyName?: string | null;
  scheduledAt?: string | null;
  published: boolean;
  status: "draft" | "published" | "scheduled" | "archived";
  createdAt: string;
}

export interface AmenityQuery {
  page?: number;
  limit?: number;
  type?: AmenityType;
  propertyId?: string;
  isActive?: boolean;
}

export interface BookingQuery {
  page?: number;
  limit?: number;
  amenityId?: string;
  propertyId?: string;
}

export interface PostQuery {
  page?: number;
  limit?: number;
  propertyId?: string;
  postType?: PostType;
  audience?: PostAudience;
}

interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

function buildParams(query: Record<string, unknown | undefined>): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useAmenities(query: AmenityQuery = {}) {
  return useQuery({
    queryKey: ["amenities", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Amenity[]>>(
        `/amenities${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<Amenity>;
    },
  });
}

export function useAmenity(id: string) {
  return useQuery({
    queryKey: ["amenity", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Amenity>>(`/amenities/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Amenity>) => {
      const { data } = await api.post<ApiResponse<Amenity>>("/amenities", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
    },
  });
}

export function useUpdateAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Amenity> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Amenity>>(`/amenities/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
      queryClient.invalidateQueries({ queryKey: ["amenity", variables.id] });
      void result;
    },
  });
}

export function useDeleteAmenity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ id: string }>>(`/amenities/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["amenities"] });
    },
  });
}

export function useBookings(query: BookingQuery = {}) {
  return useQuery({
    queryKey: ["amenity-bookings", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AmenityBooking[]>>(
        `/amenity-bookings${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<AmenityBooking>;
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AmenityBooking>) => {
      const { data } = await api.post<ApiResponse<AmenityBooking>>(
        "/amenity-bookings",
        payload
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["amenity-bookings"] });
      if (result?.amenityId) {
        queryClient.invalidateQueries({ queryKey: ["amenity", result.amenityId] });
      }
    },
  });
}

export function usePosts(query: PostQuery = {}) {
  return useQuery({
    queryKey: ["community-posts", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CommunityPost[]>>(
        `/community-posts${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<CommunityPost>;
    },
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<CommunityPost>) => {
      const { data } = await api.post<ApiResponse<CommunityPost>>(
        "/community-posts",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}
