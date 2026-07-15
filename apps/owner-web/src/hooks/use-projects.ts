import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export type ProjectType = "land_development" | "new_construction" | "renovation" | "maintenance";
export type ProjectStatus = "planning" | "in_progress" | "delayed" | "completed" | "cancelled";

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  status: ProjectStatus;
  description?: string;
  startDate?: string;
  targetStartDate?: string;
  targetCompletionDate?: string;
  address?: string;
  projectLogoUrl?: string;
  completionPercentage: number;
  totalBudget?: number;
  totalSpent?: number;
  totalValue?: number;
  projectedROI?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ProjectStatus;
}

export function useProjects(query: ProjectQuery = {}) {
  return useQuery({
    queryKey: ["owner-projects", query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set("page", String(query.page));
      if (query.limit) params.set("limit", String(query.limit));
      if (query.search) params.set("search", query.search);
      if (query.status) params.set("status", query.status);
      const { data } = await api.get<ApiResponse<Project[]>>(`/projects?${params}`);
      return data.data;
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["owner-project", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Project>>(`/projects/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export interface TimelinePhase {
  id: string;
  phaseName: string;
  phaseOrder: number;
  status: string;
  targetStart?: string | null;
  targetEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
}

export interface ProjectTimeline {
  projectId: string;
  projectName: string;
  targetStartDate?: string | null;
  targetCompletionDate?: string | null;
  phases: TimelinePhase[];
}

export function useProjectTimeline(id: string) {
  return useQuery({
    queryKey: ["owner-project-timeline", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ProjectTimeline>>(`/projects/${id}/timeline`);
      return data.data;
    },
    enabled: !!id,
  });
}

export interface BudgetHealth {
  healthScore: "green" | "yellow" | "red";
  variancePercentage: number;
  totalPlanned: number;
  totalActual: number;
  plannedVsActual: { category: string; planned: number; actual: number }[];
}

export function useBudgetHealth(projectId: string) {
  return useQuery({
    queryKey: ["owner-budget-health", projectId],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<BudgetHealth>>(`/projects/${projectId}/budget-health`);
      return data.data;
    },
    enabled: !!projectId,
  });
}
