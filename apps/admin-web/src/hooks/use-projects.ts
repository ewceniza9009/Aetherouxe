import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, PaginationMeta } from "@elite-realty/shared-types";

export type ProjectType = "high_rise" | "mid_rise" | "village" | "township" | "commercial_complex";
export type ProjectStatus = "planning" | "pre_selling" | "construction" | "fit_out" | "completed" | "turnover";

export interface ProjectImage {
  id: string;
  projectId: string;
  url: string;
  alt?: string | null;
  sortOrder: number;
  isPrimary: boolean;
  createdAt: string;
}

export interface Project {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  projectType: ProjectType;
  status: ProjectStatus;
  totalPhases?: number | null;
  targetStartDate?: string | null;
  targetCompletionDate?: string | null;
  actualCompletionDate?: string | null;
  projectLogoUrl?: string | null;
  address?: string | null;
  createdAt: string;
  images?: ProjectImage[];
}

export const projectTypeLabels: Record<ProjectType, string> = {
  high_rise: "High Rise",
  mid_rise: "Mid Rise",
  village: "Village",
  township: "Township",
  commercial_complex: "Commercial Complex",
};

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  pre_selling: "Pre-Selling",
  construction: "Construction",
  fit_out: "Fit-Out",
  completed: "Completed",
  turnover: "Turnover",
};

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

export function useProjectImages(projectId: string) {
  return useQuery({
    queryKey: ["project-images", projectId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProjectImage[]>>(`/images/project/${projectId}`);
      return data.data;
    },
    enabled: !!projectId,
  });
}

export function useUploadProjectImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      file,
      alt,
      isPrimary,
    }: {
      projectId: string;
      file: File;
      alt?: string;
      isPrimary?: boolean;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      const params = new URLSearchParams();
      if (alt) params.append("alt", alt);
      if (isPrimary) params.append("isPrimary", "true");
      
      const { data } = await api.post<ApiResponse<ProjectImage>>(
        `/images/project/${projectId}?${params.toString()}`,
        formData
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["project-images", variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
