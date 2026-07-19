import { UserType } from "./enums";

export * from "./enums";

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    type: UserType;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  type: UserType;
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: UserType;
  iat?: number;
  exp?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
export * from './schemas';
