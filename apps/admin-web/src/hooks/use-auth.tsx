import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { UserType } from "@elite-realty/shared-types";
import api from "@/lib/api";
import { bootstrapSettings } from "@/lib/settings-store";

interface User {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  type: UserType;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("accessToken")) {
      void bootstrapSettings();
    }
  }, []);

  const refetchUser = useCallback(async () => {
    if (!localStorage.getItem("accessToken")) return;
    try {
      const { data: resp } = await api.get("/auth/me");
      const userData: User = (resp as any).data ?? resp;
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data: resp } = await api.post("/auth/login", { email, password });
      const body = (resp as any).data ?? resp;
      const userData: User = body.user;
      localStorage.setItem("accessToken", body.accessToken);
      localStorage.setItem("refreshToken", body.refreshToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      void bootstrapSettings();
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refetchUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
