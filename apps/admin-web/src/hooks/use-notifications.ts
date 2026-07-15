import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export type NotificationRole = "admin" | "owner" | "resident";

export type NotificationType =
  | "payment"
  | "lease"
  | "maintenance"
  | "rto"
  | "document"
  | "community"
  | "alert"
  | "general";

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

function buildParams(role: NotificationRole, ownerId?: string, tenantId?: string) {
  const params = new URLSearchParams({ role });
  if (ownerId) params.set("ownerId", ownerId);
  if (tenantId) params.set("tenantId", tenantId);
  return params.toString();
}

export function useSyncNotifications(
  role: NotificationRole,
  ownerId?: string,
  tenantId?: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<{ created: number }>>(
        "/notifications/sync",
        { role, ownerId, tenantId }
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", role] }),
  });
}

export function useMarkRead(role: NotificationRole) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<unknown>>("/notifications/mark-read", {
        id,
      });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", role] }),
  });
}

export function useMarkAllRead(
  role: NotificationRole,
  ownerId?: string,
  tenantId?: string
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<ApiResponse<unknown>>(
        "/notifications/mark-all-read",
        { role, ownerId, tenantId }
      );
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications", role] }),
  });
}

export function useNotifications(
  role: NotificationRole = "admin",
  opts?: { ownerId?: string; tenantId?: string }
) {
  const ownerId = opts?.ownerId;
  const tenantId = opts?.tenantId;

  const query = useQuery({
    queryKey: ["notifications", role, ownerId, tenantId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AppNotification[]>>(
        `/notifications?${buildParams(role, ownerId, tenantId)}`
      );
      return ((data.data as any)?.notifications ?? []) as AppNotification[];
    },
  });

  const sync = useSyncNotifications(role, ownerId, tenantId);
  const markRead = useMarkRead(role);
  const markAllRead = useMarkAllRead(role, ownerId, tenantId);

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    isError: query.isError,
    sync: () => sync.mutateAsync(),
    markRead: (id: string) => markRead.mutateAsync(id),
    markAllRead: () => markAllRead.mutateAsync(),
  };
}
