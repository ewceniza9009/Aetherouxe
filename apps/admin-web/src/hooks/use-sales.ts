import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { type ApiResponse, type SchemeListItem } from "@elite-realty/shared-types";

export function useSalesSchemes() {
  return useQuery<SchemeListItem[]>({
    queryKey: ["sales", "schemes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SchemeListItem[]>>("/sales");
      return data.data;
    },
  });
}

