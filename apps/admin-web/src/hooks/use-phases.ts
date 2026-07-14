import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  status: "not_started" | "in_progress" | "completed" | "delayed";
  startDate?: string;
  endDate?: string;
  progress: number;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export function usePhases(projectId: string) {
  return useQuery({
    queryKey: ["phases", projectId],
    queryFn: async () => {
      const params = new URLSearchParams({ projectId });
      const { data } = await api.get<ApiResponse<Phase[]>>(`/phases?${params}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function usePhase(id: string) {
  return useQuery({
    queryKey: ["phase", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Phase>>(`/phases/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Phase>) => {
      const { data } = await api.post<ApiResponse<Phase>>("/phases", payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["phases", result.projectId] });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Phase> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Phase>>(`/phases/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["phases", result.projectId] });
      queryClient.invalidateQueries({ queryKey: ["phase", result.id] });
    },
  });
}

export function useDeletePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await api.delete(`/phases/${id}`);
      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ["phases", projectId] });
    },
  });
}
