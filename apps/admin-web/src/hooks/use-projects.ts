import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type ProjectType = "land_development" | "new_construction" | "renovation" | "maintenance";
export type ProjectStatus = "planning" | "in_progress" | "delayed" | "completed" | "cancelled";

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  status: ProjectStatus;
  description?: string;
  startDate?: string;
  targetEndDate?: string;
  actualEndDate?: string;
  address?: string;
  logoUrl?: string;
  completionPercentage: number;
  totalBudget?: number;
  totalSpent?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  search?: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
}

interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useProjects(query: ProjectQuery) {
  return useQuery({
    queryKey: ["projects", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.sort) params.set("sort", query.sort);
      if (query.order) params.set("order", query.order);
      if (query.search) params.set("search", query.search);
      if (query.status) params.set("status", query.status);
      if (query.projectType) params.set("projectType", query.projectType);
      const { data } = await api.get<ApiResponse<Project[]>>(`/projects?${params}`);
      return { data: data.data, meta: data.meta } as PaginatedResult<Project>;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Project>) => {
      const { data } = await api.post<ApiResponse<Project>>("/projects", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Project> & { id: string }) => {
      const { data } = await api.patch<ApiResponse<Project>>(`/projects/${id}`, payload);
      return data.data;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", result.id] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useProjectTimeline(id: string) {
  return useQuery({
    queryKey: ["project-timeline", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/projects/${id}/timeline`);
      const payload = data.data;
      const phases: any[] = payload?.phases ?? (Array.isArray(payload) ? payload : []);
      return phases.map((p) => ({
        id: p.id,
        phaseName: p.phaseName ?? p.name,
        startDate: p.targetStart ?? p.actualStart ?? p.startDate ?? null,
        endDate: p.targetEnd ?? p.actualEnd ?? p.endDate ?? null,
        status: p.status,
        progress:
          p.progress ??
          (p.status === "completed" ? 100 : p.status === "in_progress" ? 50 : p.status === "delayed" ? 50 : 0),
      })) as ProjectTimelineEntry[];
    },
    enabled: !!id,
  });
}

export interface ProjectTimelineEntry {
  id: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
}
