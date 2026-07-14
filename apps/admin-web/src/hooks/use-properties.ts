import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PropertyType, PropertyStatus } from "@elite-realty/shared-types";

export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  buildingId?: string;
  floorId?: string;
  unitId?: string;
  description?: string;
  units: number;
  yearBuilt?: number;
  lotSize?: string;
  totalSquareFeet?: string;
  monthlyRevenue?: number;
  occupancyRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface PropertySpecs {
  id?: string;
  propertyId: string;
  floorPlanImage?: string;
  ceilingHeight?: string;
  finishType?: string;
  appliances?: string;
  ac?: string;
  flooring?: string;
  smartHomeFeatures?: string;
  lotArea?: string;
  floorArea?: string;
  bedrooms?: number;
  bathrooms?: number;
  garden?: boolean;
  garage?: boolean;
  dimensions?: string;
  covered?: boolean;
  nearbyElevator?: boolean;
}

export interface PropertyQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  type?: PropertyType;
  status?: PropertyStatus;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useProperties(query: PropertyQuery) {
  return useQuery({
    queryKey: ["properties", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      if (query.search) params.set("search", query.search);
      if (query.type) params.set("type", query.type);
      if (query.status) params.set("status", query.status);
      const { data } = await api.get<ApiResponse<Property[]>>(`/properties?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<Property>;
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Property>>(`/properties/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Property>) => {
      const { data } = await api.post<ApiResponse<Property>>("/properties", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Property> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Property>>(`/properties/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      queryClient.invalidateQueries({ queryKey: ["property", result.id] });
    },
  });
}

export function useDeleteProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["properties"] });
    },
  });
}

export function usePropertySpecs(id: string) {
  return useQuery({
    queryKey: ["property-specs", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<PropertySpecs>>(`/properties/${id}/specs`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useUpdatePropertySpecs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...specs }: Partial<PropertySpecs> & { id: string }) => {
      const { data } = await api.put<ApiResponse<PropertySpecs>>(`/properties/${id}/specs`, specs);
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["property-specs", variables.id] });
    },
  });
}
