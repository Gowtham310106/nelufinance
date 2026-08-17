// src/features/auth/hooks/use-auth.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import { api, setToken, clearToken } from "@/lib/api-client";

interface User {
  id: string;
  phone: string;
  name: string;
  role: "owner" | "employee";
  language: "en" | "ta";
  businessId?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("vetrinel_token") : null;

    if (!token) {
      setState({ user: null, isLoading: false, isAuthenticated: false });
      return;
    }

    api
      .get<{ success: boolean; data: User }>("/auth/me")
      .then((res) => {
        setState({ user: res.data, isLoading: false, isAuthenticated: true });
      })
      .catch(() => {
        clearToken();
        setState({ user: null, isLoading: false, isAuthenticated: false });
      });
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const res = await api.post<AuthResponse>("/auth/login", input);
    setToken(res.data.token);
    setState({ user: res.data.user, isLoading: false, isAuthenticated: true });
    return res.data.user;
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const res = await api.post<AuthResponse>("/auth/register", input);
    setToken(res.data.token);
    setState({ user: res.data.user, isLoading: false, isAuthenticated: true });
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setState({ user: null, isLoading: false, isAuthenticated: false });
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
  };
}
