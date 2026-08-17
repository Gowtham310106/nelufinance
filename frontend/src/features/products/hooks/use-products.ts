// src/features/products/hooks/use-products.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

export interface Product {
  _id: string;
  name: string;
  nameTamil?: string;
  category: string;
  unit: string;
  purchasePricePaise: number;
  sellingPricePaise: number;
  currentStockKg: number;
  minimumStockKg: number;
  weightedAvgCostPaisePerKg: number;
  active: boolean;
  createdAt: string;
}

export interface CreateProductInput {
  name: string;
  nameTamil?: string;
  category: string;
  unit: string;
  purchasePricePaise: number;
  sellingPricePaise: number;
  initialStockKg: number;
  minimumStockKg: number;
}

export interface UpdateProductInput {
  name?: string;
  nameTamil?: string;
  category?: string;
  unit?: string;
  purchasePricePaise?: number;
  sellingPricePaise?: number;
  minimumStockKg?: number;
  active?: boolean;
}

export function useProducts(options: { search?: string; category?: string; activeOnly?: boolean } = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["products", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.search) params.append("search", options.search);
      if (options.category) params.append("category", options.category);
      if (options.activeOnly !== undefined) params.append("activeOnly", String(options.activeOnly));

      const endpoint = `/products${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await api.get<{ success: boolean; data: Product[] }>(endpoint);
      return res.data;
    },
  });

  const createProduct = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const res = await api.post<{ success: boolean; data: Product }>("/products", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const updateProduct = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProductInput }) => {
      const res = await api.put<{ success: boolean; data: Product }>(`/products/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });

  return {
    products: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
