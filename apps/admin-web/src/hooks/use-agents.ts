import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

function mapAgent(a: any): Agent {
  const user = a.user ?? {};
  const first = user.firstName ?? "";
  const last = user.lastName ?? "";
  const composed = `${first} ${last}`.trim();
  const managerUser = a.manager?.user;
  return {
    id: a.id,
    userId: a.userId,
    tenantId: a.tenantId,
    name: composed || user.email || a.email || undefined,
    email: user.email ?? a.email,
    phone: user.phone ?? a.phone,
    avatarUrl: user.avatarUrl ?? a.avatarUrl,
    licenseNumber: a.licenseNumber,
    tier: a.tier,
    commissionRateDefault: a.commissionRateDefault,
    isInternal: a.isInternal,
    managerId: a.managerId,
    managerName: managerUser
      ? `${managerUser.firstName ?? ""} ${managerUser.lastName ?? ""}`.trim() ||
        managerUser.email
      : undefined,
    licenseStatus: a.licenseStatus ?? "compliant",
    status: a.status ?? "active",
    transactionCount: a.transactionCount,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  } as Agent;
}

export type AgentTierValue =
  | "junior"
  | "senior"
  | "team_lead"
  | "external_broker";

export type LicenseStatus = "compliant" | "expired" | "pending" | "suspended";
export type AgentStatus = "active" | "inactive" | "probation";

export interface Agent {
  id: string;
  userId?: string;
  tenantId?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  licenseNumber?: string;
  tin?: string;
  tier: AgentTierValue;
  commissionRateDefault?: number;
  isInternal: boolean;
  managerId?: string;
  managerName?: string;
  licenseStatus: LicenseStatus;
  licenseExpiry?: string;
  status: AgentStatus;
  totalSalesVolume?: number;
  commissionEarned?: number;
  commissionPaid?: number;
  propertiesSold?: number;
  propertiesLeased?: number;
  transactionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentPerformance {
  totalSalesVolume: number;
  commissionEarned: number;
  commissionPaid: number;
  propertiesSold: number;
  propertiesLeased: number;
  pendingCommission?: number;
  unpaidCommission?: number;
}

export interface LicenseRenewal {
  id: string;
  agentId: string;
  licenseNumber?: string;
  renewalDate: string;
  expiryDate: string;
  cpeUnits: number;
  cpeRequired?: number;
  status: LicenseStatus;
  reference?: string;
  notes?: string;
  createdAt?: string;
}

export interface AgentQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  tier?: AgentTierValue;
  isInternal?: boolean;
  status?: AgentStatus;
}

export interface AgentPayload {
  userId: string;
  tenantId: string;
  phone?: string;
  licenseNumber?: string;
  tin?: string;
  tier: AgentTierValue;
  commissionRateDefault?: number;
  isInternal: boolean;
  managerId?: string;
  licenseStatus?: LicenseStatus;
  licenseExpiry?: string;
  status?: AgentStatus;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useAgents(query: AgentQuery) {
  return useQuery({
    queryKey: ["agents", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      if (query.search) params.set("search", query.search);
      if (query.tier) params.set("tier", query.tier);
      if (query.isInternal !== undefined)
        params.set("isInternal", String(query.isInternal));
      if (query.status) params.set("status", query.status);
      const { data } = await api.get<ApiResponse<Agent[]>>(`/agents?${params}`);
      const raw = (data.data ?? []) as any[];
      const mapped: Agent[] = raw.map((a) => mapAgent(a));
      return { data: mapped, meta: data.meta } as PaginatedResult<Agent>;
    },
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Agent>>(`/agents/${id}`);
      return mapAgent(data.data ?? {});
    },
    enabled: !!id,
  });
}

export function useAgentPerformance(id: string) {
  const { data: agent } = useAgent(id);
  return useQuery({
    queryKey: ["agent-performance", id],
    queryFn: async () => {
      try {
        const { data } = await api.get<ApiResponse<AgentPerformance>>(
          `/agents/${id}/performance`
        );
        if (data?.data) return data.data as AgentPerformance;
      } catch {
        // fall through to derived performance
      }
      return {
        totalSalesVolume: agent?.totalSalesVolume ?? 0,
        commissionEarned: agent?.commissionEarned ?? 0,
        commissionPaid: agent?.commissionPaid ?? 0,
        propertiesSold: agent?.propertiesSold ?? 0,
        propertiesLeased: agent?.propertiesLeased ?? 0,
        pendingCommission: (agent?.totalSalesVolume ?? 0) - (agent?.commissionPaid ?? 0),
        unpaidCommission: (agent?.commissionEarned ?? 0) - (agent?.commissionPaid ?? 0),
      } as AgentPerformance;
    },
    enabled: !!id,
  });
}

export function useAgentLicenseRenewals(agentId: string) {
  return useQuery({
    queryKey: ["agent-license-renewals", agentId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (agentId) params.set("agentId", agentId);
      const { data } = await api.get<ApiResponse<LicenseRenewal[]>>(
        `/agents/${agentId}/license-renewals?${params}`
      );
      return data.data;
    },
    enabled: !!agentId,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AgentPayload) => {
      const { data } = await api.post<ApiResponse<Agent>>("/agents", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: AgentPayload & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Agent>>(`/agents/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["agent", variables.id] });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });
}

export interface LicenseRenewalPayload {
  licenseNumber?: string;
  renewalDate: string;
  expiryDate: string;
  cpeUnits: number;
  cpeRequired?: number;
  status: LicenseStatus;
  reference?: string;
  notes?: string;
}

export function useCreateLicenseRenewal(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: LicenseRenewalPayload) => {
      const { data } = await api.post<ApiResponse<LicenseRenewal>>(
        `/agents/${agentId}/license-renewals`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-license-renewals", agentId] });
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
    },
  });
}

export function useUpdateLicenseRenewal(agentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: LicenseRenewalPayload & { id: string }) => {
      const { data } = await api.patch<ApiResponse<LicenseRenewal>>(
        `/agents/${agentId}/license-renewals/${id}`,
        payload
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-license-renewals", agentId] });
    },
  });
}
