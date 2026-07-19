import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@elite-realty/shared-ui/lib/api';
import type { ApiResponse, PaginationMeta } from '@elite-realty/shared-types';

export type AppUserType =
  'super_admin' | 'admin' | 'property_manager' | 'finance' | 'agent' | 'owner' | 'tenant';

export interface AppUser {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  userType: AppUserType;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  tenant?: { id: string; name?: string; domain?: string } | null;
}

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  userType?: AppUserType;
  isActive?: boolean;
  sort?: string;
  order?: 'asc' | 'desc';
}

interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export function useUsers(query: UserQuery) {
  return useQuery({
    queryKey: ['users', query],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.search) params.set('search', query.search);
      if (query.userType) params.set('userType', query.userType);
      if (typeof query.isActive === 'boolean') params.set('isActive', String(query.isActive));
      if (query.sort) params.set('sort', query.sort);
      if (query.order) params.set('order', query.order);
      const { data } = await api.get<ApiResponse<AppUser[]>>(`/users?${params}`);
      return { data: data.data ?? [], meta: data.meta } as Paginated<AppUser>;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<AppUser>>(`/users/${id}`);
      return data.data;
    },
  });
}

export interface CreateUserPayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  userType: AppUserType;
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post<ApiResponse<AppUser>>('/users', payload);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...payload
    }: Partial<AppUser> & { id: string; password?: string }) => {
      const { data } = await api.patch<ApiResponse<AppUser>>(`/users/${id}`, payload);
      return data.data;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      void result;
    },
  });
}

export function useUploadUserAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await api.post<ApiResponse<{ url: string }>>(
        `/images/user/${id}/avatar`,
        formData,
      );
      return data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['auth-user'] });
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['agent'] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });
}
