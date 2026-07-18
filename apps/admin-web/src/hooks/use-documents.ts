import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type DocumentOwnerType =
  | "property"
  | "unit"
  | "tenant"
  | "lease"
  | "owner"
  | "rto"
  | "project"
  | "vendor";

export type DocumentType =
  | "lease_agreement"
  | "contract"
  | "id_proof"
  | "invoice"
  | "statement"
  | "permit"
  | "insurance"
  | "title_deed"
  | "maintenance_record"
  | "other";

export type SignatureStatus = "pending" | "sent" | "signed" | "declined";

export interface DocumentSignature {
  id: string;
  documentId: string;
  signerName: string;
  signerEmail: string;
  signatureUrl?: string | null;
  status: SignatureStatus;
  signedAt?: string | null;
  createdAt: string;
}

export interface DocumentVault {
  id: string;
  ownerType: DocumentOwnerType;
  ownerId: string;
  documentType: DocumentType;
  title: string;
  fileName?: string | null;
  fileUrl?: string | null;
  isSigned: boolean;
  expiryDate?: string | null;
  uploadedById?: string | null;
  createdAt: string;
  signatures?: DocumentSignature[];
}

export interface DocumentQuery {
  page?: number;
  limit?: number;
  ownerType?: DocumentOwnerType;
  ownerId?: string;
  documentType?: DocumentType;
  isSigned?: boolean;
  sort?: string;
  order?: "asc" | "desc";
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

export function useDocuments(query: DocumentQuery = {}) {
  return useQuery({
    queryKey: ["documents", query],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DocumentVault[]>>(
        `/documents${buildParams(query as Record<string, unknown>)}`
      );
      return { data: data.data, meta: data.meta } as Paginated<DocumentVault>;
    },
  });
}

export function useDocument(id: string) {
  return useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DocumentVault>>(`/documents/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<DocumentVault>) => {
      const { data } = await api.post<ApiResponse<DocumentVault>>("/documents", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useRequestSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      signerName,
      signerEmail,
      signatureUrl,
    }: {
      id: string;
      signerName: string;
      signerEmail: string;
      signatureUrl?: string;
    }) => {
      const { data } = await api.post<ApiResponse<DocumentSignature>>(
        `/documents/${id}/request-signature`,
        { signerName, signerEmail, signatureUrl }
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables.id] });
      void result;
    },
  });
}

export function useMarkSignatureSigned() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<ApiResponse<DocumentVault>>(
        `/documents/${id}/mark-signed`,
        {}
      );
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["document", variables] });
      void result;
    },
  });
}
