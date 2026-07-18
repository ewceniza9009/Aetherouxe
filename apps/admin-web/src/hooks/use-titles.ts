import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

interface PaginatedResult<T> {
  data: T[];
  meta?: PaginationMeta;
}

export type TitleTransferStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type TitleTransferBasis =
  | "spot_cash"
  | "installment_paid"
  | "rto_exercised"
  | "mortgage_settled"
  | "manual";

export const titleTransferStatusLabels: Record<TitleTransferStatus, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const titleTransferBasisLabels: Record<TitleTransferBasis, string> = {
  spot_cash: "Spot Cash",
  installment_paid: "Installment Paid",
  rto_exercised: "RTO Exercised",
  mortgage_settled: "Mortgage Settled",
  manual: "Manual",
};

export interface TitleParty {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

export interface TitleTransfer {
  id: string;
  propertyId: string;
  unitId?: string | null;
  leaseAgreementId?: string | null;
  buyerUserId: string;
  previousOwnerUserId?: string | null;
  basis: TitleTransferBasis;
  status: TitleTransferStatus;
  titleNumber?: string | null;
  contractValue?: string | null;
  amountSettled?: string | null;
  transferFeeAmount?: string | null;
  requestedDate: string;
  completedDate?: string | null;
  titleDocumentUrl?: string | null;
  notes?: string | null;
  property?: { id: string; propertyCode: string; project?: { name: string } };
  unit?: { id: string; unitNumber: string } | null;
  buyer?: TitleParty;
  previousOwner?: TitleParty | null;
  processedBy?: TitleParty | null;
}

export interface TitleTransferInput {
  propertyId?: string;
  unitId?: string;
  leaseAgreementId?: string;
  buyerUserId?: string;
  previousOwnerUserId?: string;
  basis?: TitleTransferBasis;
  status?: TitleTransferStatus;
  titleNumber?: string;
  contractValue?: number;
  amountSettled?: number;
  transferFeeAmount?: number;
  titleDocumentUrl?: string;
  notes?: string;
}

export interface TitleTransferQuery {
  propertyId?: string;
  buyerUserId?: string;
  status?: TitleTransferStatus;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
}

export function useTitleTransfers(query: TitleTransferQuery = {}) {
  return useQuery({
    queryKey: ["title-transfers", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.propertyId) params.set("propertyId", query.propertyId);
      if (query.buyerUserId) params.set("buyerUserId", query.buyerUserId);
      if (query.status) params.set("status", query.status);
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      const { data } = await api.get<ApiResponse<TitleTransfer[]>>(
        `/title-transfers?${params}`
      );
      return { data: data.data ?? [], meta: data.meta } as PaginatedResult<TitleTransfer>;
    },
  });
}

export function useTitleTransfer(id: string) {
  return useQuery({
    queryKey: ["title-transfer", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<TitleTransfer>>(`/title-transfers/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTitleTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: TitleTransferInput) => {
      const { data } = await api.post<ApiResponse<TitleTransfer>>("/title-transfers", input);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["title-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateTitleTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: TitleTransferInput & { id: string }) => {
      const { data } = await api.patch<ApiResponse<TitleTransfer>>(
        `/title-transfers/${id}`,
        input
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["title-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["title-transfer", result.id] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useCompleteTitleTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<TitleTransfer>>(
        `/title-transfers/${id}/complete`,
        {}
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["title-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useDeleteTitleTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/title-transfers/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["title-transfers"] });
    },
  });
}

