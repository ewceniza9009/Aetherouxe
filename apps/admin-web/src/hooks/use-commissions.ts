import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { AgentTier, PropertyType } from '@elite-realty/shared-types';
import type { ApiResponse, PaginationMeta } from '@elite-realty/shared-types';

export type CommissionRuleType =
  'flat_amount' | 'percentage_of_sale' | 'percentage_of_rent' | 'tiered';
export type CommissionRuleScope = 'all' | AgentTier;
export type CommissionRulePropertyScope = 'all' | PropertyType;

export interface CommissionRule {
  id: string;
  name: string;
  tier: CommissionRuleScope;
  propertyType: CommissionRulePropertyScope;
  type: CommissionRuleType;
  value: number | Array<{ upto: number | null; rate: number }>;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt?: string;
}

export interface CommissionRulePayload {
  name: string;
  tier: CommissionRuleScope;
  propertyType: CommissionRulePropertyScope;
  type: CommissionRuleType;
  value: number | Array<{ upto: number | null; rate: number }>;
  status?: 'active' | 'inactive';
}

export type AgentTransactionType = 'sale' | 'rental_lease' | 'rto_contract' | 'lease_renewal';

export type AgentTransactionStatus =
  'pending' | 'approved' | 'paid' | 'partially_paid' | 'fully_paid' | 'rejected' | 'cancelled';

export interface AgentTransaction {
  id: string;
  agentId: string;
  agentName?: string;
  type: AgentTransactionType;
  propertyId?: string;
  propertyName?: string;
  transactionAmount: number;
  commissionRuleId?: string;
  leaseAgreementId?: string;
  amount: number;
  commissionRate?: number;
  commissionAmount: number;
  owedCommission?: number;
  paidCommission?: number;
  remainingCommission?: number;
  status: AgentTransactionStatus;
  transactionDate: string;
  reference?: string;
  notes?: string;
}

export type CommissionReleaseType = 'partial' | 'full' | 'advance' | 'bonus' | 'adjustment';

export interface CommissionRelease {
  id: string;
  agentId: string;
  agentName?: string;
  amount: number;
  releaseDate: string;
  type: CommissionReleaseType;
  reference?: string;
  notes?: string;
}

export interface CommissionAgingBucket {
  label: string;
  minDays: number;
  maxDays: number | null;
  total: number;
  count: number;
}

export interface CommissionAgingByAgent {
  agentId: string;
  agentName: string;
  total: number;
  worstBucket: string;
}

export interface CommissionAgingByProject {
  projectId?: string;
  projectName: string;
  total: number;
}

export interface CommissionAgingReport {
  totalUnpaid: number;
  buckets: CommissionAgingBucket[];
  byAgent: CommissionAgingByAgent[];
  byProject: CommissionAgingByProject[];
}

export interface CommissionQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'active' | 'inactive';
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface AgentTransactionQuery {
  page?: number;
  limit?: number;
  agentId?: string;
  status?: AgentTransactionStatus;
  type?: AgentTransactionType;
}

export interface CommissionReleaseQuery {
  agentId?: string;
  type?: CommissionReleaseType;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useCommissions(query: CommissionQuery) {
  return useQuery({
    queryKey: ['commissions', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.search) params.set('search', query.search);
      if (query.status) params.set('status', query.status);
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      const { data } = await api.get<ApiResponse<CommissionRule[]>>(`/commissions?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<CommissionRule>;
    },
  });
}

export function useCommission(id: string) {
  return useQuery({
    queryKey: ['commission', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CommissionRule>>(`/commissions/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CommissionRulePayload) => {
      const { data } = await api.post<ApiResponse<CommissionRule>>('/commissions', payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}

export function useUpdateCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: CommissionRulePayload & { id: string }) => {
      const { data } = await api.patch<ApiResponse<CommissionRule>>(`/commissions/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
      queryClient.invalidateQueries({ queryKey: ['commission', variables.id] });
    },
  });
}

export function useDeleteCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/commissions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commissions'] });
    },
  });
}

export function useAgentTransactions(query: AgentTransactionQuery) {
  return useQuery({
    queryKey: ['agent-transactions', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.agentId) params.set('agentId', query.agentId);
      if (query.status) params.set('status', query.status);
      if (query.type) params.set('type', query.type);
      const { data } = await api.get<ApiResponse<AgentTransaction[]>>(
        `/agent-transactions?${params}`,
      );
      return { data: data.data, meta: data.meta } as PaginatedResult<AgentTransaction>;
    },
  });
}

export function useAgentTransaction(id: string) {
  return useQuery({
    queryKey: ['agent-transaction', id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AgentTransaction>>(`/agent-transactions/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export interface AgentTransactionPayload {
  agentId: string;
  type: AgentTransactionType;
  propertyId?: string;
  leaseAgreementId?: string;
  transactionAmount: number;
  commissionRuleId?: string;
  amount: number;
  commissionRate?: number;
  commissionAmount: number;
  status?: AgentTransactionStatus;
  transactionDate?: string;
  reference?: string;
  notes?: string;
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AgentTransactionPayload) => {
      const { data } = await api.post<ApiResponse<AgentTransaction>>(
        '/agent-transactions',
        payload,
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
      if (result.agentId) {
        queryClient.invalidateQueries({
          queryKey: ['agent-transactions', { agentId: result.agentId }],
        });
        queryClient.invalidateQueries({ queryKey: ['agent', result.agentId] });
        queryClient.invalidateQueries({ queryKey: ['agent-performance', result.agentId] });
      }
    },
  });
}

export function useApproveTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<AgentTransaction>>(
        `/agent-transactions/${id}/approve`,
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
      if (result.agentId) {
        queryClient.invalidateQueries({
          queryKey: ['agent-transactions', { agentId: result.agentId }],
        });
        queryClient.invalidateQueries({ queryKey: ['agent', result.agentId] });
      }
    },
  });
}

export function useCommissionReleases(query: CommissionReleaseQuery) {
  return useQuery({
    queryKey: ['commission-releases', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.agentId) params.set('agentId', query.agentId);
      if (query.type) params.set('type', query.type);
      const { data } = await api.get<ApiResponse<CommissionRelease[]>>(
        `/commission-releases?${params}`,
      );
      return data.data;
    },
  });
}

export interface CommissionReleasePayload {
  agentId: string;
  amount: number;
  releaseDate?: string;
  type: CommissionReleaseType;
  reference?: string;
  notes?: string;
}

export function useCreateRelease() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CommissionReleasePayload) => {
      const { data } = await api.post<ApiResponse<CommissionRelease>>(
        '/commission-releases',
        payload,
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['commission-releases'] });
      if (result.agentId) {
        queryClient.invalidateQueries({
          queryKey: ['commission-releases', { agentId: result.agentId }],
        });
        queryClient.invalidateQueries({ queryKey: ['agent', result.agentId] });
        queryClient.invalidateQueries({ queryKey: ['agent-performance', result.agentId] });
      }
    },
  });
}

export interface PayCommissionPayload {
  amount: number;
  releaseType?: 'full_payout' | 'partial_payout' | 'advance' | 'adjustment' | 'clawback';
  paymentDate?: string;
  paymentMethod?: string;
  paymentReference?: string;
  approvedByUserId?: string;
  notes?: string;
}

export function usePayCommission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      agentTransactionId,
      ...payload
    }: PayCommissionPayload & { agentTransactionId: string }) => {
      const { data } = await api.post<ApiResponse<unknown>>(
        `/commission-releases/pay/${agentTransactionId}`,
        payload,
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['commission-releases'] });
      queryClient.invalidateQueries({ queryKey: ['commission-aging'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      queryClient.invalidateQueries({ queryKey: ['agent-performance'] });
    },
  });
}

export function useCommissionAging() {
  return useQuery({
    queryKey: ['commission-aging'],
    queryFn: async () => {
      const { data } =
        await api.get<ApiResponse<CommissionAgingReport>>(`/commission-aging/report`);
      return data.data;
    },
  });
}
