import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface Unit {
  id: string;
  propertyId: string;
  buildingId: string;
  floorId: string;
  unitNumber: string;
  type: string;
  size: number;
  unitType?: string;
  squareMeters?: number;
  bedrooms: number;
  bathrooms: number;
  status: string;
  features?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UnitQuery {
  page?: number;
  limit?: number;
  propertyId?: string;
  type?: string;
  status?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useUnits(query: UnitQuery) {
  return useQuery({
    queryKey: ["units", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.propertyId) params.set("propertyId", query.propertyId);
      if (query.type) params.set("type", query.type);
      if (query.status) params.set("status", query.status);
      const { data } = await api.get<ApiResponse<any[]>>(`/units?${params}`);
      const transformed = (data.data ?? []).map((u: any) => ({
        id: u.id,
        propertyId: u.propertyId,
        buildingId: u.buildingId,
        floorId: u.floorId,
        unitNumber: u.unitNumber,
        type: u.unitType || u.type,
        size: u.squareMeters ?? u.size,
        squareMeters: u.squareMeters,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        status: u.status || (u.unitType ? "available" : "unknown"),
        unitType: u.unitType,
        features: u.features,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      }));
      return { data: transformed, meta: data.meta } as PaginatedResult<Unit>;
    },
  });
}

export function useUnit(id: string) {
  return useQuery({
    queryKey: ["unit", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/units/${id}`);
      const u = data.data;
      return {
        id: u.id,
        propertyId: u.propertyId,
        buildingId: u.buildingId,
        floorId: u.floorId,
        unitNumber: u.unitNumber,
        type: u.unitType || u.type,
        size: u.squareMeters ?? u.size,
        squareMeters: u.squareMeters,
        bedrooms: u.bedrooms,
        bathrooms: u.bathrooms,
        status: u.status || "available",
        unitType: u.unitType,
        features: u.features,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      } as Unit;
    },
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Unit>) => {
      const { data } = await api.post<ApiResponse<Unit>>("/units", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Unit> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Unit>>(`/units/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["unit", result.id] });
    },
  });
}

export function useDeleteUnit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/units/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
}
