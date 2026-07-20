import { useQuery } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse } from '@elite-realty/shared-types';

export interface CompanyOwnerInfo {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export function useCompanyOwner() {
  return useQuery({
    queryKey: ['company-owner'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<CompanyOwnerInfo>>('/company-owner');
      return (data.data ?? null) as CompanyOwnerInfo | null;
    },
  });
}
