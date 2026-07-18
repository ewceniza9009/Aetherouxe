import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@elite-realty/shared-types";

export type PhaseStatus = "planning" | "in_progress" | "completed" | "delayed" | "on_hold";

export const phaseStatusLabels: Record<PhaseStatus, string> = {
  planning: "Planning",
  in_progress: "In Progress",
  completed: "Completed",
  delayed: "Delayed",
  on_hold: "On Hold",
};

export interface Phase {
  id: string;
  projectId: string;
  name: string;
  status: PhaseStatus;
  targetStart?: string;
  targetEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  order: number;
  progress: number;
  createdAt: string;
}

export interface PhaseInput {
  projectId?: string;
  name?: string;
  status?: PhaseStatus;
  targetStart?: string;
  targetEnd?: string;
  actualStart?: string;
  actualEnd?: string;
  order?: number;
}

function progressFor(status: string): number {
  switch (status) {
    case "completed": return 100;
    case "in_progress": return 50;
    case "delayed": return 40;
    case "on_hold": return 25;
    default: return 0;
  }
}

interface RawPhaseApi {
  id: string;
  projectId: string;
  phaseName?: string;
  name?: string;
  phaseOrder?: number;
  order?: number;
  progress?: number;
  progressPercent?: number;
  status?: string;
  targetStart?: string | null;
  targetEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

function mapPhase(p: RawPhaseApi): Phase {
  return {
    id: p.id,
    projectId: p.projectId,
    name: p.phaseName ?? p.name ?? "",
    status: (p.status ?? "pending") as Phase["status"],
    targetStart: p.targetStart ?? undefined,
    targetEnd: p.targetEnd ?? undefined,
    actualStart: p.actualStart ?? undefined,
    actualEnd: p.actualEnd ?? undefined,
    order: p.phaseOrder ?? p.order ?? 0,
    progress: p.progress ?? progressFor(p.status ?? "pending"),
    createdAt: p.createdAt,
  };
}

function toApiPayload(input: PhaseInput): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input.projectId !== undefined) out.projectId = input.projectId;
  if (input.name !== undefined) out.phaseName = input.name;
  if (input.status !== undefined) out.status = input.status;
  if (input.order !== undefined) out.phaseOrder = input.order;
  if (input.targetStart !== undefined) out.targetStart = input.targetStart || undefined;
  if (input.targetEnd !== undefined) out.targetEnd = input.targetEnd || undefined;
  if (input.actualStart !== undefined) out.actualStart = input.actualStart || undefined;
  if (input.actualEnd !== undefined) out.actualEnd = input.actualEnd || undefined;
  return out;
}

export function usePhases(projectId: string) {
  return useQuery({
    queryKey: ["phases", projectId],
    queryFn: async () => {
      const params = new URLSearchParams({ projectId });
      const { data } = await api.get<ApiResponse<any[]>>(`/phases?${params}`);
      return (data.data ?? []).map(mapPhase);
    },
    enabled: !!projectId,
  });
}

export function usePhase(id: string) {
  return useQuery({
    queryKey: ["phase", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<any>>(`/phases/${id}`);
      return mapPhase(data.data);
    },
    enabled: !!id,
  });
}

export function useCreatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: PhaseInput) => {
      const { data } = await api.post<ApiResponse<any>>("/phases", toApiPayload(input));
      return mapPhase(data.data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["phases", result.projectId] });
    },
  });
}

export function useUpdatePhase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: PhaseInput & { id: string }) => {
      const { data } = await api.patch<ApiResponse<any>>(`/phases/${id}`, toApiPayload(input));
      return mapPhase(data.data);
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

