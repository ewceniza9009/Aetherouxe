import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta, PropertyType, PropertyStatus } from "@elite-realty/shared-types";
import type { RawProperty, RawPropertyImage } from "@/types/api";

export interface PropertyImage {
  id: string;
  url: string;
  alt?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface Property {
  id: string;
  code: string;
  name: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  projectId?: string;
  projectName?: string;
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
  images?: PropertyImage[];
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
  projectId?: string;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function transformProperty(p: RawProperty): Property {
  const units = Array.isArray(p.units) ? p.units : [];
  type BuildingLike = { name?: string; address?: string; id?: string };
  const buildingRef = (units[0] as { building?: BuildingLike } | undefined)?.building
    ?? (p.building as BuildingLike | null | undefined)
    ?? (Array.isArray(p.buildings) ? p.buildings[0] : undefined);
  const firstUnit = units[0] as { buildingId?: string; floorId?: string | null } | undefined;
  const images: PropertyImage[] = (p.images ?? []).map((img: RawPropertyImage) => ({
    id: img.id,
    url: img.url,
    alt: img.alt ?? undefined,
    isPrimary: img.isPrimary ?? false,
    sortOrder: img.sortOrder ?? 0,
  }));
  return {
    id: p.id,
    code: p.propertyCode ?? p.code ?? "",
    name: buildingRef?.name ?? p.name ?? p.propertyCode ?? "Unnamed Property",
    address: buildingRef?.address ?? p.address ?? "",
    type: (p.propertyType ?? p.type ?? "apartment") as PropertyType,
    status: (p.status ?? "available") as PropertyStatus,
    projectId: p.projectId ?? p.project?.id,
    projectName: p.project?.name,
    buildingId: p.buildingId ?? firstUnit?.buildingId ?? buildingRef?.id,
    floorId: p.floorId ?? firstUnit?.floorId ?? undefined,
    unitId: p.unitId ?? undefined,
    description: p.description ?? undefined,
    units: p._count?.units ?? units.length,
    yearBuilt: p.yearBuilt ?? undefined,
    lotSize: p.lotSize ?? undefined,
    totalSquareFeet: p.totalSquareFeet ?? undefined,
    monthlyRevenue: p.monthlyRevenue ?? undefined,
    occupancyRate: p.occupancyRate ?? undefined,
    images,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
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
      if (query.projectId) params.set("projectId", query.projectId);
      const { data } = await api.get<ApiResponse<RawProperty[]>>(`/properties?${params}`);
      const raw = data.data;
      const transformed = raw.map(transformProperty);
      return { data: transformed, meta: data.meta } as PaginatedResult<Property>;
    },
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ["property", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<RawProperty>>(`/properties/${id}`);
      return transformProperty(data.data);
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

