import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface Contractor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone?: string;
  specialization: string;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Engagement {
  id: string;
  contractorId: string;
  projectId: string;
  projectName?: string;
  contractAmount: number;
  paidAmount: number;
  status: "pending" | "active" | "completed" | "terminated";
  startDate?: string;
  endDate?: string;
  scope?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  engagementId: string;
  amount: number;
  paymentDate: string;
  method: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface ContractorQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: string;
  specialization?: string;
  status?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useContractors(query: ContractorQuery) {
  return useQuery({
    queryKey: ["contractors", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.search) params.set("search", query.search);
      if (query.specialization) params.set("specialization", query.specialization);
      if (query.status) params.set("status", query.status);
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      const { data } = await api.get<ApiResponse<Contractor[]>>(`/contractors?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<Contractor>;
    },
  });
}

export function useContractor(id: string) {
  return useQuery({
    queryKey: ["contractor", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Contractor>>(`/contractors/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Contractor>) => {
      const { data } = await api.post<ApiResponse<Contractor>>("/contractors", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
    },
  });
}

export function useUpdateContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Contractor> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Contractor>>(`/contractors/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
      queryClient.invalidateQueries({ queryKey: ["contractor", result.id] });
    },
  });
}

export function useDeleteContractor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/contractors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contractors"] });
    },
  });
}

export function useEngagements(query: { contractorId?: string; projectId?: string }) {
  return useQuery({
    queryKey: ["engagements", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.contractorId) params.set("contractorId", query.contractorId);
      if (query.projectId) params.set("projectId", query.projectId);
      const { data } = await api.get<ApiResponse<Engagement[]>>(`/engagements?${params}`);
      return data.data;
    },
  });
}

export function useCreateEngagement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Engagement>) => {
      const { data } = await api.post<ApiResponse<Engagement>>("/engagements", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
    },
  });
}

export function useUpdateEngagementStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Engagement["status"] }) => {
      const { data } = await api.patch<ApiResponse<Engagement>>(`/engagements/${id}`, { status });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
    },
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Payment>) => {
      const { data } = await api.post<ApiResponse<Payment>>("/payments", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagements"] });
    },
  });
}

