import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type ServiceCategory =
  | "maintenance"
  | "plumbing"
  | "electrical"
  | "hvac"
  | "landscaping"
  | "security"
  | "cleaning"
  | "elevator"
  | "pest_control"
  | "other";

export type ServicePriority = "low" | "medium" | "high" | "emergency";

export type ServiceStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled";

export type WorkOrderStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface ServiceRequest {
  id: string;
  requestNumber?: string | null;
  category: ServiceCategory;
  priority: ServicePriority;
  status: ServiceStatus;
  description: string;
  propertyId?: string | null;
  propertyName?: string | null;
  unitId?: string | null;
  unitLabel?: string | null;
  tenantName?: string | null;
  tenantId?: string | null;
  requestedById?: string | null;
  assignedToId?: string | null;
  assignedToName?: string | null;
  scheduledAt?: string | null;
  resolutionNotes?: string | null;
  createdAt: string;
  updatedAt: string;
  workOrders?: WorkOrder[];
}

export interface WorkOrder {
  id: string;
  serviceRequestId: string;
  vendor?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  scheduledDate?: string | null;
  notes?: string | null;
  status: WorkOrderStatus;
  createdAt: string;
}

export interface ServiceRequestQuery {
  page?: number;
  limit?: number;
  status?: ServiceStatus;
  priority?: ServicePriority;
  category?: ServiceCategory;
  propertyId?: string;
}

export interface WorkOrderQuery {
  page?: number;
  limit?: number;
  serviceRequestId?: string;
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

export function useServiceRequests(query: ServiceRequestQuery = {}) {
  return useQuery({
    queryKey: ["service-requests", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ServiceRequest[]>>(
        `/service-requests${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<ServiceRequest>;
    },
  });
}

export function useServiceRequest(id: string) {
  return useQuery({
    queryKey: ["service-request", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ServiceRequest>>(
        `/service-requests/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateServiceRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ServiceRequest>) => {
      const { data } = await api.post<ApiResponse<ServiceRequest>>(
        "/service-requests",
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
    },
  });
}

export function useAssignRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      assignedToId,
      assignedToName,
    }: {
      id: string;
      assignedToId: string;
      assignedToName?: string;
    }) => {
      const { data } = await api.post<ApiResponse<ServiceRequest>>(
        `/service-requests/${id}/assign`,
        { assignedToId, assignedToName }
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-request", variables.id] });
      void result;
    },
  });
}

export function useCompleteRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      resolutionNotes,
    }: {
      id: string;
      resolutionNotes?: string;
    }) => {
      const { data } = await api.post<ApiResponse<ServiceRequest>>(
        `/service-requests/${id}/complete`,
        { resolutionNotes }
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-request", variables.id] });
      void result;
    },
  });
}

export function useCancelRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { data } = await api.post<ApiResponse<ServiceRequest>>(
        `/service-requests/${id}/cancel`,
        { reason }
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["service-requests"] });
      queryClient.invalidateQueries({ queryKey: ["service-request", variables.id] });
      void result;
    },
  });
}

export function useWorkOrders(query: WorkOrderQuery = {}) {
  return useQuery({
    queryKey: ["work-orders", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<WorkOrder[]>>(
        `/work-orders${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<WorkOrder>;
    },
  });
}

export function useCreateWorkOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<WorkOrder>) => {
      const { data } = await api.post<ApiResponse<WorkOrder>>("/work-orders", payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["work-orders"] });
      if (result?.serviceRequestId) {
        queryClient.invalidateQueries({
          queryKey: ["service-request", result.serviceRequestId],
        });
      }
    },
  });
}
