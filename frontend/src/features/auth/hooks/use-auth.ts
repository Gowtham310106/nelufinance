// src/features/auth/hooks/use-auth.ts
"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setToken, clearToken, getToken } from "@/lib/api-client";

interface User {
  id: string;
  phone: string;
  name: string;
  role: "owner" | "employee";
  language: "en" | "ta";
  businessId?: string;
}

interface LoginInput {
  phone: string;
  password: string;
}

interface RegisterInput {
  phone: string;
  password: string;
  name: string;
  language?: "en" | "ta";
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

/**
 * Auth state is kept in the React Query cache so every component that calls
 * useAuth() shares the same user — one /auth/me request per session, and
 * logging out anywhere signs the user out everywhere (AuthGuard redirects).
 */
export function useAuth() {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async (): Promise<User | null> => {
      if (!getToken()) return null;
      try {
        const res = await api.get<{ success: boolean; data: User }>("/auth/me");
        return res.data;
      } catch {
        clearToken();
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const startSession = useCallback(
    (res: AuthResponse) => {
      setToken(res.data.token);
      // Drop any data cached for a previously signed-in user/business
      queryClient.clear();
      queryClient.setQueryData(AUTH_QUERY_KEY, res.data.user);
      return res.data.user;
    },
    [queryClient],
  );

  const login = useCallback(
    async (input: LoginInput) => startSession(await api.post<AuthResponse>("/auth/login", input)),
    [startSession],
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      startSession(await api.post<AuthResponse>("/auth/register", input)),
    [startSession],
  );

  const logout = useCallback(() => {
    clearToken();
    queryClient.clear();
    queryClient.setQueryData(AUTH_QUERY_KEY, null);
  }, [queryClient]);

  const user = meQuery.data ?? null;

  return {
    user,
    isLoading: meQuery.isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };
}
