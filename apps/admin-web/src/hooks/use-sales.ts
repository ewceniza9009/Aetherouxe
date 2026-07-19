import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import { type ApiResponse, type SchemeListItem } from '@elite-realty/shared-types';

export function useSalesSchemes() {
  return useQuery<SchemeListItem[]>({
    queryKey: ['sales', 'schemes'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SchemeListItem[]>>('/sales');
      return data.data;
    },
  });
}
