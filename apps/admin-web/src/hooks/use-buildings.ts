import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export interface Building {
  id: string;
  name: string;
  type: string;
  floorCount: number;
  units: number;
  projectId: string;
  projectName?: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface BuildingQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  projectId?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function transformBuilding(b: any): Building {
  return {
    id: b.id,
    name: b.name,
    type: b.buildingType || b.type,
    floorCount: b.floorCount ?? 0,
    units: b._count?.units ?? b.unitCount ?? (Array.isArray(b.units) ? b.units.length : 0),
    projectId: b.projectId,
    projectName: b.project?.name || b.projectName,
    address: b.address,
    createdAt: b.createdAt,
    updatedAt: b.updatedAt,
  };
}

export function useBuildings(query: BuildingQuery) {
  return useQuery({
    queryKey: ["buildings", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      if (query.search) params.set("search", query.search);
      if (query.projectId) params.set("projectId", query.projectId);
      const { data } = await api.get<ApiResponse<any[]>>(`/buildings?${params}`);
      const transformed = (data.data ?? []).map(transformBuilding);
      return { data: transformed, meta: data.meta } as PaginatedResult<Building>;
    },
  });
}

export function useBuilding(id: string) {
  return useQuery({
    queryKey: ["building", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/buildings/${id}`);
      return transformBuilding(data.data);
    },
    enabled: !!id,
  });
}

export function useCreateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Building>) => {
      const { data } = await api.post<ApiResponse<Building>>("/buildings", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}

export function useUpdateBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Building> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Building>>(`/buildings/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
      queryClient.invalidateQueries({ queryKey: ["building", result.id] });
    },
  });
}

export function useDeleteBuilding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/buildings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buildings"] });
    },
  });
}
