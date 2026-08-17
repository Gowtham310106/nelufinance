// src/features/suppliers/hooks/use-suppliers.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Supplier {
  _id: string;
  name: string;
  phone: string;
  address?: string;
  currentPayablePaise: number;
  notes?: string;
  active: boolean;
  createdAt: string;
}

export interface CreateSupplierInput {
  name: string;
  phone: string;
  address?: string;
  notes?: string;
}

export interface UpdateSupplierInput {
  name?: string;
  phone?: string;
  address?: string;
  notes?: string;
  active?: boolean;
}

export function useSuppliers(options: { search?: string } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["suppliers", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.search) params.append("search", options.search);

      const endpoint = `/suppliers${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Supplier[] }>(endpoint);
      return res.data;
    },
  });

  const createSupplier = useMutation({
    mutationFn: async (data: CreateSupplierInput) => {
      const res = await api.post<{ success: boolean; data: Supplier }>("/suppliers", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  const updateSupplier = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateSupplierInput }) => {
      const res = await api.put<{ success: boolean; data: Supplier }>(`/suppliers/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });

  return {
    suppliers: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createSupplier,
    updateSupplier,
  };
}
