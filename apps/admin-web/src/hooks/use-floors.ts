import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse } from '@elite-realty/shared-types';
import type { RawUnit } from '@/types/api';

export interface Floor {
  id: string;
  buildingId: string;
  floorNumber: string;
  sortOrder: number;
  units?: RawUnit[];
  unitsCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface RawFloorApi {
  id: string;
  buildingId: string;
  floorNumber: string;
  sortOrder: number;
  units?: RawUnit[];
  unitsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export function useFloors(buildingId: string) {
  return useQuery({
    queryKey: ['floors', buildingId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Floor[]>>(`/buildings/${buildingId}/floors`);
      const floors = (data.data ?? []) as RawFloorApi[];
      return floors.map((f) => ({
        ...f,
        unitsCount: Array.isArray(f.units) ? f.units.length : (f.unitsCount ?? 0),
      })) as Floor[];
    },
    enabled: !!buildingId,
  });
}

export function useCreateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Floor> & { buildingId: string }) => {
      const { data } = await api.post<ApiResponse<Floor>>(
        `/buildings/${payload.buildingId}/floors`,
        {
          ...payload,
          floorNumber: payload.floorNumber !== undefined ? String(payload.floorNumber) : undefined,
        },
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['floors', result.buildingId] });
    },
  });
}

export function useUpdateFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      buildingId,
      ...payload
    }: Partial<Floor> & { id: string; buildingId: string }) => {
      const { data } = await api.patch<ApiResponse<Floor>>(
        `/buildings/${buildingId}/floors/${id}`,
        payload,
      );
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['floors', result.buildingId] });
    },
  });
}

export function useDeleteFloor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, buildingId }: { id: string; buildingId: string }) => {
      await api.delete(`/buildings/${buildingId}/floors/${id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['floors', variables.buildingId] });
    },
  });
}
