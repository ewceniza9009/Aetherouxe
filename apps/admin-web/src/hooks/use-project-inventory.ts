import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse } from '@elite-realty/shared-types';

export interface InventoryUnit {
  id: string;
  unitNumber: string;
  unitType: string;
  status: string;
  floorNumber?: string;
  propertyId?: string;
  propertyCode?: string;
}

export interface InventoryBuilding {
  id: string;
  name: string;
  buildingType?: string;
  floorCount: number;
  unitCount: number;
  units: InventoryUnit[];
}

export interface ProjectInventory {
  buildings: InventoryBuilding[];
  totals: {
    buildings: number;
    units: number;
    byStatus: Record<string, number>;
  };
}

export function useProjectInventory(projectId: string) {
  return useQuery({
    queryKey: ['project-inventory', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectInventory> => {
      const { data: bResp } = await api.get<ApiResponse<any[]>>(
        `/buildings?projectId=${projectId}&limit=200`,
      );
      const buildingsRaw = bResp.data ?? [];

      const buildings: InventoryBuilding[] = await Promise.all(
        buildingsRaw.map(async (b: any) => {
          const { data: uResp } = await api.get<ApiResponse<any[]>>(
            `/units?buildingId=${b.id}&limit=500`,
          );
          const units: InventoryUnit[] = (uResp.data ?? []).map((u: any) => ({
            id: u.id,
            unitNumber: u.unitNumber,
            unitType: u.unitType,
            status: u.status,
            floorNumber: u.floor?.floorNumber,
            propertyId: u.property?.id ?? u.propertyId,
            propertyCode: u.property?.propertyCode,
          }));
          return {
            id: b.id,
            name: b.name,
            buildingType: b.buildingType,
            floorCount: b.floorCount ?? (Array.isArray(b.floors) ? b.floors.length : 0),
            unitCount: units.length,
            units,
          };
        }),
      );

      const byStatus: Record<string, number> = {};
      let unitTotal = 0;
      for (const b of buildings) {
        for (const u of b.units) {
          byStatus[u.status] = (byStatus[u.status] ?? 0) + 1;
          unitTotal++;
        }
      }

      return {
        buildings,
        totals: {
          buildings: buildings.length,
          units: unitTotal,
          byStatus,
        },
      };
    },
  });
}
