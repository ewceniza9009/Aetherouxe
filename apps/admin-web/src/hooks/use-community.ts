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

export type PostAudience = "all" | "building" | "property" | "unit";

export type ModerationStatus = "published" | "hidden" | "archived";

export type ReportStatus = "open" | "reviewed" | "dismissed" | "actioned";

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
  isPublished?: boolean;
  moderationStatus: ModerationStatus;
  moderationReason?: string | null;
  status: "draft" | "published" | "scheduled" | "archived";
  commentCount?: number;
  openReportCount?: number;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  postTitle?: string | null;
  authorId?: string | null;
  authorName?: string | null;
  body: string;
  moderationStatus: ModerationStatus;
  openReportCount?: number;
  createdAt: string;
}

export interface PostReport {
  id: string;
  postId?: string | null;
  postTitle?: string | null;
  commentId?: string | null;
  commentBody?: string | null;
  reason: string;
  details?: string | null;
  reporterName?: string | null;
  status: ReportStatus;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
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
  moderationStatus?: ModerationStatus;
}

export interface CommentQuery {
  page?: number;
  limit?: number;
  postId?: string;
  moderationStatus?: ModerationStatus;
}

export interface ReportQuery {
  page?: number;
  limit?: number;
  status?: ReportStatus;
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
      const { data } = await api.get<ApiResponse<any[]>>(
        `/amenity-bookings${buildParams(query as Record<string, unknown>)}`
      );
      const mapped = (data.data ?? []).map((b: any) => ({
        id: b.id,
        amenityId: b.amenityId,
        amenityName: b.amenity?.name ?? null,
        tenantName: b.tenant ? `${b.tenant.firstName ?? ""} ${b.tenant.lastName ?? ""}`.trim() || null : b.tenantName ?? null,
        tenantId: b.tenantId ?? null,
        unitLabel: b.unit?.unitNumber ?? b.unitLabel ?? null,
        unitId: b.unitId ?? null,
        startDateTime: b.bookingStart ?? b.startDateTime,
        endDateTime: b.bookingEnd ?? b.endDateTime,
        amount: b.totalAmount ?? b.amount ?? null,
        notes: b.notes ?? null,
        status: b.status,
        createdAt: b.createdAt,
      }));
      return { data: mapped, meta: data.meta } as Paginated<AmenityBooking>;
    },
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<AmenityBooking>) => {
      const { data } = await api.post<ApiResponse<AmenityBooking>>(
        "/amenity-bookings",
        {
          amenityId: payload.amenityId,
          tenantName: payload.tenantName,
          unitLabel: payload.unitLabel,
          bookingStart: payload.startDateTime,
          bookingEnd: payload.endDateTime,
          totalAmount: payload.amount,
          notes: payload.notes,
          status: payload.status,
        }
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

function mapPost(p: any): CommunityPost {
  const moderationStatus: ModerationStatus = p.moderationStatus ?? "published";
  return {
    id: p.id,
    title: p.title,
    body: p.body,
    postType: p.postType,
    audience: p.audience,
    propertyId: p.propertyId ?? null,
    propertyName: p.property?.name ?? p.property?.propertyCode ?? p.propertyName ?? null,
    scheduledAt: p.scheduledAt ?? null,
    published: p.isPublished ?? p.published ?? false,
    isPublished: p.isPublished,
    moderationStatus,
    moderationReason: p.moderationReason ?? null,
    status:
      moderationStatus === "archived"
        ? "archived"
        : p.scheduledAt && !(p.isPublished ?? p.published)
          ? "scheduled"
          : (p.isPublished ?? p.published)
            ? "published"
            : "draft",
    commentCount: p._count?.comments ?? p.commentCount ?? 0,
    openReportCount: p._count?.reports ?? p.openReportCount ?? 0,
    createdAt: p.createdAt,
  };
}

export function usePosts(query: PostQuery = {}) {
  return useQuery({
    queryKey: ["community-posts", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any[]>>(
        `/community-posts${buildParams(query as Record<string, unknown>)}`
      );
      return {
        data: (data.data ?? []).map(mapPost),
        meta: data.meta,
      } as Paginated<CommunityPost>;
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

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<CommunityPost> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<CommunityPost>>(
        `/community-posts/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ deleted: boolean }>>(
        `/community-posts/${id}`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["post-reports"] });
    },
  });
}

export function useModeratePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      moderationStatus,
      reason,
    }: {
      id: string;
      moderationStatus: ModerationStatus;
      reason?: string;
    }) => {
      const { data } = await api.patch<ApiResponse<CommunityPost>>(
        `/community-posts/${id}/moderate`,
        { moderationStatus, reason }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-posts"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-logs"] });
    },
  });
}

/* ----------------------------- Comments ----------------------------- */

function mapComment(c: any): PostComment {
  return {
    id: c.id,
    postId: c.postId,
    postTitle: c.post?.title ?? null,
    authorId: c.authorId ?? null,
    authorName:
      c.authorName ??
      (c.author
        ? `${c.author.firstName ?? ""} ${c.author.lastName ?? ""}`.trim()
        : null),
    body: c.body,
    moderationStatus: c.moderationStatus ?? "published",
    openReportCount: c._count?.reports ?? 0,
    createdAt: c.createdAt,
  };
}

export function useComments(query: CommentQuery = {}) {
  return useQuery({
    queryKey: ["post-comments", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any[]>>(
        `/post-comments${buildParams(query as Record<string, unknown>)}`
      );
      return {
        data: (data.data ?? []).map(mapComment),
        meta: data.meta,
      } as Paginated<PostComment>;
    },
  });
}

export function useModerateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      moderationStatus,
    }: {
      id: string;
      moderationStatus: ModerationStatus;
    }) => {
      const { data } = await api.patch<ApiResponse<PostComment>>(
        `/post-comments/${id}/moderate`,
        { moderationStatus }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-logs"] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete<ApiResponse<{ deleted: boolean }>>(
        `/post-comments/${id}`
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
      queryClient.invalidateQueries({ queryKey: ["post-reports"] });
    },
  });
}

/* ----------------------------- Reports ----------------------------- */

function mapReport(r: any): PostReport {
  return {
    id: r.id,
    postId: r.postId ?? null,
    postTitle: r.post?.title ?? null,
    commentId: r.commentId ?? null,
    commentBody: r.comment?.body ?? null,
    reason: r.reason,
    details: r.details ?? null,
    reporterName:
      r.reporterName ??
      (r.reportedBy
        ? `${r.reportedBy.firstName ?? ""} ${r.reportedBy.lastName ?? ""}`.trim()
        : null),
    status: r.status,
    resolutionNote: r.resolutionNote ?? null,
    resolvedAt: r.resolvedAt ?? null,
    createdAt: r.createdAt,
  };
}

export function useReports(query: ReportQuery = {}) {
  return useQuery({
    queryKey: ["post-reports", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any[]>>(
        `/post-reports${buildParams(query as Record<string, unknown>)}`
      );
      return {
        data: (data.data ?? []).map(mapReport),
        meta: data.meta,
      } as Paginated<PostReport>;
    },
  });
}

export function useResolveReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      resolutionNote,
    }: {
      id: string;
      status: ReportStatus;
      resolutionNote?: string;
    }) => {
      const { data } = await api.patch<ApiResponse<PostReport>>(
        `/post-reports/${id}/resolve`,
        { status, resolutionNote }
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-reports"] });
      queryClient.invalidateQueries({ queryKey: ["moderation-logs"] });
    },
  });
}
